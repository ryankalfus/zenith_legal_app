"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuperAdminAllowlist = getSuperAdminAllowlist;
function getSuperAdminAllowlist() {
    return (process.env.SUPER_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
}
