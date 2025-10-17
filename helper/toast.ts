import { toast } from "react-toastify";

export const showToast = (message: string, type: "success" | "error") => {
  if (type === "success") {
    toast.success(message, { autoClose: 2000, position: "bottom-right" });
  } else {
    toast.error(message, { autoClose: 2000, position: "bottom-right" });
  }
};
