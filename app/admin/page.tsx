import Link from "next/link";

const ADMIN_LINKS = [
  {
    href: "/admin/analysis",
    title: "AI分析結果一覧",
    description: "AI分析結果の一覧表示・削除",
  },
  {
    href: "/admin/history",
    title: "レートヒストリー（週次表）",
    description: "週単位・時刻×曜日のレート推移表",
  },
  {
    href: "/admin/export",
    title: "データダウンロード",
    description: "期間を指定して分析結果・レートヒストリーをJSONでダウンロード",
  },
];

export default function AdminTopPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">管理画面</h1>
      <ul className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {ADMIN_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-2xl bg-zinc-900 p-5 ring-1 ring-white/10 transition-colors hover:bg-zinc-800"
            >
              <p className="text-base font-medium text-white">{link.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{link.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
