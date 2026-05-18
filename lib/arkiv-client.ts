import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";

export const arkivPublicClient = createPublicClient({
  chain: braga,
  transport: http(),
});
