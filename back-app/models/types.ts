export type place = {
  id?: string;
  title?: string;
  description?: string;
  coordinates?: { lat: number; lon: number };
  address?: string;
  creator?: string;
};

export type user = {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
};
