<script setup lang="ts">
import { ref } from 'vue';

import {
  Button,
  Form,
  FormItem,
  Modal,
  Select,
  Space,
  Tag,
  Upload,
  message,
  Progress,
} from 'ant-design-vue';

import {
  batchImport,
  downloadTemplate,
  ListTypeOptions,
  ListLevelOptions,
  type BatchImportResult,
} from '#/api/list/list';
import { listAllGroup } from '#/api/list/list-group';

import * as XLSX from 'xlsx';

const loading = ref(false);
const uploadLoading = ref(false);

// 分组选项
const groupOptions = ref<Array<{ label: string; value: number }>>([]);

// 导入状态
const importState = ref({
  visible: false,
  title: '批量导入',
  groupId: undefined as number | undefined,
  listType: '',
  listLevel: '',
  file: null as File | null,
  progress: 0,
});

// 导入结果
const importResult = ref<{
  visible: boolean;
  total: number;
  success: number;
  covered: string[];
}>({
  visible: false,
  total: 0,
  success: 0,
  covered: [],
});

// 加载分组选项
const loadGroupOptions = async () => {
  try {
    const groups = await listAllGroup();
    groupOptions.value = groups.map((g) => ({ label: g.groupName, value: g.id! }));
  } catch (error) {
    console.error('获取分组列表失败:', error);
  }
};

// 打开导入弹窗
const handleOpenImport = async () => {
  await loadGroupOptions();
  importState.value = {
    visible: true,
    title: '批量导入',
    groupId: undefined,
    listType: 'ACCOUNT',
    listLevel: 'BLACK',
    file: null,
    progress: 0,
  };
  importResult.value = { visible: false, total: 0, success: 0, covered: [] };
};

// 文件上传前校验
const beforeUpload = (file: File) => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  if (!isExcel) {
    message.error('只能上传 Excel 文件！');
    return false;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB！');
    return false;
  }
  importState.value.file = file;
  return false; // 阻止自动上传
};

// 解析 Excel 文件
const parseExcel = (file: File): Promise<Array<{ listValue: string; expireDays?: number; reason?: string }>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // 跳过表头，从第二行开始解析
        const rows = jsonData.slice(1);
        const result = rows
          .filter((row) => row[0] && String(row[0]).trim() !== '')
          .map((row) => ({
            listValue: String(row[0]).trim(),
            expireDays: row[1] ? Number(row[1]) : undefined,
            reason: row[2] ? String(row[2]).trim() : undefined,
          }));

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

// 执行导入
const handleImport = async () => {
  if (!importState.value.groupId) {
    message.warning('请选择名单分组');
    return;
  }
  if (!importState.value.file) {
    message.warning('请选择要导入的文件');
    return;
  }

  uploadLoading.value = true;
  importState.value.progress = 10;

  try {
    // 解析 Excel 文件
    const importData = await parseExcel(importState.value.file);
    importState.value.progress = 40;

    if (importData.length === 0) {
      message.warning('Excel 文件中没有有效数据');
      uploadLoading.value = false;
      return;
    }

    if (importData.length > 10000) {
      message.error('单次导入最多 10000 条，当前 ' + importData.length + ' 条');
      uploadLoading.value = false;
      return;
    }

    importState.value.progress = 60;

    // 调用后端接口
    const result = await batchImport(
      importState.value.groupId,
      importState.value.listType,
      importState.value.listLevel,
      importData
    );

    importState.value.progress = 100;

    // 显示导入结果
    importResult.value = {
      visible: true,
      total: result.total,
      success: result.success,
      covered: result.covered,
    };

    // 关闭导入弹窗
    importState.value.visible = false;
  } catch (error: any) {
    console.error('导入失败:', error);
    const errorMsg = error?.message || error?.response?.data?.message || '导入失败';
    message.error(errorMsg);
  } finally {
    uploadLoading.value = false;
    importState.value.progress = 0;
  }
};

// 下载模板
const handleDownloadTemplate = () => {
  const url = downloadTemplate();
  const link = document.createElement('a');
  link.href = url;
  link.download = '名单导入模板.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 组件初始化时加载分组选项
loadGroupOptions();

defineExpose({
  openImport: handleOpenImport,
});
</script>

<template>
  <!-- 导入弹窗 -->
  <Modal
    v-model:open="importState.visible"
    :title="importState.title"
    :confirm-loading="uploadLoading"
    width="500px"
    @ok="handleImport"
  >
    <Form layout="vertical">
      <FormItem label="下载模板">
        <Button @click="handleDownloadTemplate">下载导入模板</Button>
      </FormItem>
      <FormItem label="名单分组" required>
        <Select
          v-model:value="importState.groupId"
          :options="groupOptions"
          placeholder="请选择名单分组"
        />
      </FormItem>
      <FormItem label="名单类型" required>
        <Select
          v-model:value="importState.listType"
          :options="ListTypeOptions"
          placeholder="请选择名单类型"
        />
      </FormItem>
      <FormItem label="名单级别" required>
        <Select
          v-model:value="importState.listLevel"
          :options="ListLevelOptions"
          placeholder="请选择名单级别"
        />
      </FormItem>
      <FormItem label="上传文件">
        <Upload
          :before-upload="beforeUpload"
          :max-count="1"
          accept=".xlsx,.xls"
        >
          <Button :loading="uploadLoading">
            {{ importState.file ? importState.file.name : '选择 Excel 文件' }}
          </Button>
        </Upload>
      </FormItem>
      <Progress v-if="uploadLoading" :percent="importState.progress" status="active" />
    </Form>
  </Modal>

  <!-- 导入结果弹窗 -->
  <Modal
    v-model:open="importResult.visible"
    title="导入结果"
    :footer="null"
  >
    <Space direction="vertical" style="width: 100%">
      <Tag color="green">导入成功 {{ importResult.success }} 条</Tag>
      <Tag v-if="importResult.covered.length > 0" color="orange">
        覆盖 {{ importResult.covered.length }} 条
      </Tag>
      <div v-if="importResult.covered.length > 0">
        <p class="font-bold">覆盖的名单值：</p>
        <div class="max-h-40 overflow-y-auto">
          <Tag v-for="value in importResult.covered" :key="value" color="orange">
            {{ value }}
          </Tag>
        </div>
      </div>
    </Space>
  </Modal>
</template>
