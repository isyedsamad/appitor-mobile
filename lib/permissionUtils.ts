export function hasPermission(user: any, required: any, isForAll: any) {
  if(isForAll) return true;
  if (!required) return true;
  if (user.permissions?.includes("*")) return true;
  if (Array.isArray(required)) {
    return required.some((p) => user.permissions?.includes(p));
  }
  return user.permissions?.includes(required);
}
