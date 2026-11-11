
import { buildModule } from
"@nomicfoundation/hardhat-ignition/modules";

const LostFoundModule = buildModule(
  "LostFoundModule",
  (m) => {

    const lostFound = m.contract("LostFound");

    return { lostFound };
  }
);

export default LostFoundModule;
