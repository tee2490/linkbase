// What /user/[handle] shows. Public fields only: no user id, email or link ids (docs/auth.md).
export type PublicLink = {
  title: string;
  url: string;
};

export type PublicProfile = {
  handle: string;
  links: PublicLink[];
};
