import { TOKNE_INFO } from "./module/configs";
import { pumpProcess } from "./processes";

(async () => {
  const resp = await pumpProcess(TOKNE_INFO);
})();
