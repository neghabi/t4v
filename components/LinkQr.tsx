"use client";
import { useState } from "react";
import Image from "next/image";
export function LinkQr({ code, baseUrl }: { code: string; baseUrl: string }) {
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="surface mb-5 p-5">
      <h3 className="font-semibold">QR لینک شما</h3>
      <p className="section-note my-3">ساخت و دریافت QR این لینک رایگان است.</p>
      {qr ? (
        <>
          <Image
            unoptimized
            width={180}
            height={180}
            src={qr}
            alt="کد QR لینک"
            className="rounded-lg bg-white p-2"
          />
          <a
            download={`t4v-${code}.png`}
            href={qr}
            className="button-secondary mt-3"
          >
            دانلود PNG
          </a>
        </>
      ) : (
        <button
          className="button-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const r = await fetch("/api/qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: `${baseUrl}/${code}`,
                  shortCode: code,
                }),
              });
              const d = await r.json();
              if (!r.ok) throw Error(d.error);
              setQr(d.dataUrl);
            } catch (e) {
              setError(e instanceof Error ? e.message : "ساخت QR ممکن نشد.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "در حال ساخت…" : "دریافت QR رایگان"}
        </button>
      )}
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
    </section>
  );
}
