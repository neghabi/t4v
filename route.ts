import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: "لطفاً تمام فیلدها را پر کنید." }, { status: 400 });
    }

    // In a real application, you would send an email or save to a database here.
    // For this example, we'll just log it to the console.
    console.log("Contact form submission received:", { name, email, message });

    return NextResponse.json({ message: "پیام با موفقیت دریافت شد." }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "خطای سرور داخلی" }, { status: 500 });
  }
}
