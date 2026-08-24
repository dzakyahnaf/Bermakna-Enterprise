import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderNav } from "@/components/header-nav";
import { Logo } from "@/components/logo";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const belumDibaca = user
    ? await prisma.notification.count({ where: { userId: user.id, isRead: false } })
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-krem-300/80 bg-krem-100/85 backdrop-blur-md">
      <div className="wrap relative flex h-16 items-center justify-between gap-4">
        <Logo />
        <HeaderNav
          user={
            user
              ? {
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  avatarUrl: user.avatarUrl,
                  isProvider: Boolean(user.provider),
                  belumDibaca,
                }
              : null
          }
        />
      </div>
    </header>
  );
}
