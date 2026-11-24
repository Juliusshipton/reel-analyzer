import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AccountSettings } from "@/components/dashboard/AccountSettings";
import { createClient } from "@/lib/supabase/server";

export default async function AccountSettingsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
        redirect("/login");
    }

    // Get user name from users table
    const { data } = await supabase.from('users').select('name').eq('id', user.id).single();
    const username = data?.name;
    


    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <DashboardHeader email={user.email} activeTab="account-settings" />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Account Settings
                    </h1>
                </header>
                <AccountSettings userEmail={user.email} userName={username}/>
            </main>
        </div>
    );
}