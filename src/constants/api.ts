import axios from "axios";
import { STAGING_URL } from "./url";

const getData = async <T>(path: string): Promise<T> => {
  const { data } = await axios.get<T>(`${STAGING_URL}${path}`);
  return data;
};

export { getData };
