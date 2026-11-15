export function IdentityFields({
  profile = {},
}: {
  profile?: {
    fullName?: string;
    phone?: string | null;
    organization?: string;
    intendedUse?: string;
    activityType?: string;
  };
}) {
  return (
    <div className="grid gap-4">
      <label className="field-label">
        نام و نام خانوادگی
        <input
          name="fullName"
          className="field"
          required
          minLength={3}
          maxLength={120}
          autoComplete="name"
          defaultValue={profile.fullName}
        />
      </label>
      <label className="field-label">
        شماره موبایل
        <input
          name="phone"
          className="field"
          required
          type="tel"
          dir="ltr"
          autoComplete="tel"
          maxLength={24}
          placeholder="09121234567"
          defaultValue={profile.phone ?? ""}
        />
      </label>
      <label className="field-label">
        نوع فعالیت
        <select
          name="activityType"
          className="field"
          defaultValue={profile.activityType ?? "personal"}
        >
          <option value="personal">شخصی</option>
          <option value="business">کسب‌وکار</option>
          <option value="organization">سازمانی</option>
        </select>
      </label>
      <label className="field-label">
        نام کسب‌وکار یا سازمان (برای فعالیت غیرشخصی)
        <input
          name="organization"
          className="field"
          maxLength={160}
          defaultValue={profile.organization}
        />
      </label>
      <label className="field-label">
        شرح فعالیت و محتوای لینک‌ها
        <textarea
          name="intendedUse"
          className="field min-h-24"
          required
          minLength={10}
          maxLength={1000}
          placeholder="هدف استفاده از سامانه و نوع محتوایی که به اشتراک می‌گذارید را بنویسید."
          defaultValue={profile.intendedUse}
        />
      </label>
      <label className="flex items-start gap-2 text-sm leading-7">
        <input name="consent" type="checkbox" required className="mt-2" />
        صحت اطلاعات را تأیید می‌کنم و با بررسی خصوصی اطلاعات و مدارک توسط مدیر و
        استفادهٔ مسئولانه از سامانه موافقم.
      </label>
    </div>
  );
}
