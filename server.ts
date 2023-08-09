require('dotenv').config();

import { blueboxInboundApp } from "./src/handlers/inbound";
import { blueboxOutboundApp } from "./src/handlers/outbound";

blueboxInboundApp.listen(8001, () => {
  console.log("Bluebox Inbound listening on port 8081");
})

blueboxOutboundApp.listen(8002, () => {
    console.log("Bluebox Outbound listening on port 8082");
});