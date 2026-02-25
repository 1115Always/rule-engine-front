import { requestClient } from "#/api/request";

export interface SceneSimple {
  sceneCode: string;
  sceneName: string;
}

/**
 * 查询场景列表
 * @returns场列表
 */
export async function getSceneListApi(): Promise<SceneSimple[]> {
  return await requestClient.get<SceneSimple[]>("/scene/list");
}