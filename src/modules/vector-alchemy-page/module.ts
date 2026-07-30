import type { ForgeModuleDef } from "@/types/module";
import VectorAlchemyPageComponent from "./VectorAlchemyPageComponent";

const vectorAlchemyPageModule: ForgeModuleDef = {
  id: "vector-alchemy-page",
  name: "[Page] Векторна алхімія",
  description: "Інтерактивна дошка векторної алхімії.",
  dependsOn: "vector-alchemy",
  urlPatterns: [
    "https://hikka.io/#alchemy",
    "https://hikka.io/?type=*#alchemy",
    "https://dev.hikka.io/#alchemy",
    "https://dev.hikka.io/?type=*#alchemy",
  ],
  enabledByDefault: true,
  hidden: true,
  elementSelector: { selector: "main", position: "replace" },
  component: VectorAlchemyPageComponent,
};

export default vectorAlchemyPageModule;
