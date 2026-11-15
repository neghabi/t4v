import { deliverNotification } from "@/lib/notificationDelivery";
export type TransactionalMail = {
  to: string;
  subject: string;
  text: string;
  actionUrl: string;
};
export async function sendTransactionalMail(mail: TransactionalMail) {
  await deliverNotification("email", mail);
}
