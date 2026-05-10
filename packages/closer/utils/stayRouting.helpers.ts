export function isStayMongoId(param: string | undefined): boolean {
  return typeof param === 'string' && /^[a-f\d]{24}$/i.test(param);
}
