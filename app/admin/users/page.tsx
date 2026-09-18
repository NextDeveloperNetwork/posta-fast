import { requireAuth } from "@/lib/auth-guards";
import { getUsersList, getOfficesList } from "@/lib/queries";
import { assignUserRoleAction } from "@/app/actions/courier-system";
import { Users, ArrowLeft, Shield, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminUsersPage() {
  const { user } = await requireAuth(["admin"]);
  const userList = await getUsersList();
  const officesList = await getOfficesList();

  async function handleAssignRole(formData: FormData) {
    "use server";
    await assignUserRoleAction(formData);
    revalidatePath("/admin/users");
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
      case "finance":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
      case "office":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      case "courier":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
      case "pending":
        return "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 font-bold";
      case "seller":
      default:
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="p-2">
          <Link href="/admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Përdoruesit & Caktimi i Roleve
          </h1>
          <p className="text-xs text-neutral-500">
            Caktoni rolet për çdo llogari (Administrator, Financë, Zyrë, Korrier, Shitës) dhe lidhni stafin me zyrën përkatëse.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            Llogaritë e Regjistruara ({userList.length})
          </h2>
        </div>

        <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
          {userList.map((u) => (
            <div
              key={u.id}
              className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {u.name || "I paemërtuar"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getRoleBadgeColor(u.role)}`}>
                    {u.role === "pending" ? "Në Pritje" : u.role}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 font-mono">
                  {u.email} {u.phone ? `• 📞 ${u.phone}` : ""}
                </div>
              </div>

              {/* Role & Office Assignment Form */}
              <form action={handleAssignRole} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="userId" value={u.id} />

                <select
                  name="role"
                  defaultValue={u.role}
                  className="h-9 px-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                >
                  <option value="pending">Në Pritje (Pending)</option>
                  <option value="seller">Shitës (Seller)</option>
                  <option value="courier">Korrier (Courier)</option>
                  <option value="office">Zyrë Postare (Office)</option>
                  <option value="finance">Financë (Finance)</option>
                  <option value="admin">Administrator (Admin)</option>
                </select>

                <select
                  name="officeId"
                  defaultValue={u.officeId || ""}
                  className="h-9 px-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                >
                  <option value="">(Pa Zyrë Specifike)</option>
                  {officesList.map((off) => (
                    <option key={off.id} value={off.id}>
                      📍 {off.name} ({off.city})
                    </option>
                  ))}
                </select>

                <Button type="submit" size="sm" className="h-9 px-3 text-xs bg-neutral-900 text-[#fce883] font-bold">
                  Përditëso
                </Button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
