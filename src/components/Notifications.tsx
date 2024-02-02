import {
  faCheckCircle,
  faInfoCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { Notification } from "@/utils/notifications";

export const getIcon = (notification: Notification) =>
  notification.type === "success"
    ? faCheckCircle
    : notification.type === "error"
    ? faTimesCircle
    : faInfoCircle;

export const getColor = (notification: Notification) =>
  notification.type === "success"
    ? "green"
    : notification.type === "error"
    ? "red"
    : "blue";

export default function Notifications({
  notifications,
}: {
  notifications: any[];
}) {
  return (
    <div className="fixed right-0 h-full z-[100] flex w-fit flex-col top-[5rem] select-none">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={index}
            className="bg-gradient relative w-full text-center text-zinc-100 p-4 rounded-xl shadow-xl text-lg"
            initial={{ opacity: 0, right: -100, top: -100 }}
            animate={{ opacity: 1, right: 100, top: "1rem" }}
            exit={{ opacity: 0, right: -100 }}
          >
            <FontAwesomeIcon icon={getIcon(notification)} />
            <span className={"ml-3"}>{notification.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
