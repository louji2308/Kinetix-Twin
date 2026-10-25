import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import { KinetixHandleVectorScenario } from "./KinetixHandleVectorScenario";
import { KinetixLaunchScenario } from "./KinetixLaunchScenario";
import { KinetixResetAndRepeatScenario } from "./KinetixResetAndRepeatScenario";

@component
export class LeafIndex extends BaseScriptComponent {
    @scenariosIndex
    static scenariosIndex: ScenarioMetadata[] = [
        {
            id: "kinetix-handle-vector",
            typename: KinetixHandleVectorScenario.getTypeName(),
        },
        {
            id: "kinetix-launch",
            typename: KinetixLaunchScenario.getTypeName(),
        },
        {
            id: "kinetix-reset-repeat",
            typename: KinetixResetAndRepeatScenario.getTypeName(),
        },
    ];
}
