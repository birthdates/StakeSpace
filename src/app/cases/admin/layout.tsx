import {isAdmin} from "@/utils/account";
import {redirect} from "next/navigation";
import {cookies} from "next/headers";
import React from "react";

export default async function AdminLayout({children}: {children: React.ReactNode}) {
    if (!(await isAdmin(cookies().get("token")?.value))) {
        redirect("/");
        return;
    }

    return <>
            {children}
        </>;
}