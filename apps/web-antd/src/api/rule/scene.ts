import { requestClient } from "#/api/request";

export interface SceneSimple {
  sceneCode: string;
  sceneName: string;
}

export interface SceneOption {
  label: string;
  value: string;
}

// 场景选项缓存
let sceneOptionsCache: SceneOption[] | null = null;

/**
 * 查询场景列表（原始数据格式）
 * @returns 场景列表
 */
export async function getSceneListApi(): Promise<SceneSimple[]> {
  return await requestClient.get<SceneSimple[]>("/scene/list");
}

/**
 * 查询场景列表（转换为Select下拉框可用格式，带缓存）
 * @param forceRefresh 是否强制刷新缓存
 * @returns Select选项数组
 */
export async function getSceneOptionsApi(forceRefresh = false): Promise<SceneOption[]> {
  // 如果有缓存且不需要强制刷新，直接返回缓存
  if (sceneOptionsCache && !forceRefresh) {
    return sceneOptionsCache;
  }
  
  const scenes = await getSceneListApi();
  sceneOptionsCache = scenes.map(scene => ({
    label: scene.sceneName,
    value: scene.sceneCode
  }));
  
  return sceneOptionsCache;
}

/**
 * 清除场景选项缓存
 */
export function clearSceneOptionsCache(): void {
  sceneOptionsCache = null;
}