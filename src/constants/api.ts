import axios from "axios";
import { STAGING_URL } from "./url";

const getData = async <T>(path: string): Promise<T> => {
  const { data } = await axios.get<T>(`${STAGING_URL}${path}`);
  return data;
};

const postData = async <T>(path: string, payload: unknown): Promise<T> => {
  const { data } = await axios.post<T>(`${STAGING_URL}${path}`, payload);
  return data;
};

export { getData, postData };
