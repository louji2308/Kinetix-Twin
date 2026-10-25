import { DefaultScenarioManager } from "Leaf.lspkg/Scenarios/scenario/manager/DefaultLeafScenarioManager";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";

@component
export class KinetixScenarioClient extends BaseScriptComponent {
    private scenarioManager = DefaultScenarioManager.getInstance();

    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            // Give 2 seconds for scene to stabilize then run LEAF scenarios
            sleep(2000).then(() => {
                this.runScenarios()
                    .then(() => print("[LEAF-RESULT] [SUCCESS] All scenarios passed."))
                    .catch((error) => print(`[LEAF-RESULT] [FAILURE] ${error}`));
            });
        });
    }

    public async runScenarios(): Promise<void> {
        const ids = this.scenarioManager.listScenarioIds();
        print(`[LEAF-CLIENT] Found ${ids.length} scenarios to execute: ${ids.join(", ")}`);
        for (let scenarioId of ids) {
            await sleep(800);
            print(`[LEAF-RUN] >>> Starting: ${scenarioId}`);
            await this.scenarioManager.startScenario(scenarioId);
            await sleep(500);
            print(`[LEAF-RUN] <<< Finished: ${scenarioId}`);
        }
    }
}
