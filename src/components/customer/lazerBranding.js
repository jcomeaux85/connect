// Lazer client branding assets + matcher.
// Scoped to customer profiles whose client (Company) is "Lazer".
export const LAZER_ASSETS = {
  logo: "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/eaf07655b_lazer.png",
  asphalt: "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/f3f9fbe46_lazer.png",
  leather: "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/56d7fb90f_ssR61.jpg",
};

export function isLazerCompany(company) {
  return !!(company?.company_name && /lazer/i.test(company.company_name));
}