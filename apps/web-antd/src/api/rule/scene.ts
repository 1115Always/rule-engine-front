import { requestClient } from "#/api/request";

export interface SceneSimple {
  sceneCode: string;
  sceneName: string;
}

export interface SceneOption {
  label: string;
  value: string;
}

/**
 * 查询场景列表（原始数据格式）
 * @returns 场景列表
 */
export async function getSceneListApi(): Promise<SceneSimple[]> {
  return await requestClient.get<SceneSimple[]>("/scene/list");
}

/**
 * 查询场景列表（转换为Select下拉框可用格式）
 * @returns Select选项数组
 */
export async function getSceneOptionsApi(): Promise<SceneOption[]> {
  const scenes = await getSceneListApi();
  return scenes.map(scene => ({
    label: scene.sceneName,
    value: scene.sceneCode
  }));
}