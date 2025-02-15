<template>
  <a-flex justify="space-between" style="margin-bottom: 16px">
    <h2>分类标签管理</h2>
    <a-button type="primary" @click="addCategoryTagDialog = true">
      <PlusCircleOutlined />
      创建分类/标签
    </a-button>
  </a-flex>
  <a-modal
    v-model:open="addCategoryTagDialog"
    title="新增分类标签"
    centered
    cancelText="取消"
    okText="创建"
    @ok="doAddCategoryTag"
  >
    <a-form layout="vertical" :model="categoryForm" @finish="handleSubmit">
      <a-form-item label="类型" name="type">
        <a-select
          v-model:value="categoryForm.type"
          :options="typeList"
          placeholder="请选择类型"
          allowClear
        />
      </a-form-item>
      <a-form-item label="名称" name="name">
        <a-input v-model:value="categoryForm.name" placeholder="请输入名称" />
      </a-form-item>
    </a-form>
  </a-modal>
  <!-- 搜索 -->
  <a-form layout="inline" :model="searchParams" @finish="doSearch">
    <a-form-item label="类型" name="type">
      <a-select
        v-model:value="searchParams.type"
        placeholder="请选择类型"
        :options="typeList"
        style="min-width: 180px"
        allow-clear
      />
    </a-form-item>
    <a-form-item name="name" label="名称">
      <a-input v-model:value="searchParams.name" placeholder="请输入分类或标签的名称" allow-clear />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit">搜索</a-button>
    </a-form-item>
  </a-form>

  <div style="margin-bottom: 20px"></div>
  <!-- 表格 -->
  <a-table
    :columns="columns"
    :data-source="dataList"
    :pagination="pagination"
    @change="doTableChange"
  >
    <template #headerCell="{ column }">
      <template v-if="column.key === 'name'">
        <span>
          <smile-outlined />
          Name
        </span>
      </template>
    </template>

    <template #bodyCell="{ column, text, record }">
      <template v-if="column.dataIndex === 'operation'">
        <div class="editable-row-operations">
          <span v-if="editableData[record.id]">
            <a-space>
              <a-typography-link @click="save(record.id)">保存</a-typography-link>
              <a-typography-link @click="cancel(record.id)">取消</a-typography-link>
            </a-space>
          </span>
          <span v-else>
            <a-space>
              <a @click="edit(record.id)">修改</a>
              <a-popconfirm
                title="确定要删除这条数据吗?"
                @confirm="doDelete(record.id)"
                ok-text="确认"
                cancel-text="取消"
              >
                <a>删除</a>
              </a-popconfirm>
            </a-space>
          </span>
        </div>
      </template>
      <template v-else>
        <div>
          <div v-if="editableData[record.id]">
            <a-select
              v-if="column.dataIndex === 'type'"
              v-model:value="editableData[record.id][0].type"
              placeholder="请选择类型"
              :options="typeList"
              style="min-width: 180px"
              allow-clear
            />
            <a-input
              v-else-if="column.dataIndex === 'name'"
              v-model:value="editableData[record.id][0].name"
              style="width: 150px"
            />
            <template v-else-if="column.dataIndex === 'createTime'">
              {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
            </template>
            <template v-else-if="column.dataIndex === 'editTime'">
              {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
            </template>
            <div v-else>
              {{ text }}
            </div>
          </div>
          <template v-else-if="column.dataIndex === 'type'">
            <div v-if="record.type === 0">
              <a-tag color="green">分类</a-tag>
            </div>
            <div v-else>
              <a-tag color="blue">标签</a-tag>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.dataIndex === 'editTime'">
            {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else>
            {{ text }}
          </template>
        </div>
      </template>
    </template>
  </a-table>
</template>
<script lang="ts" setup>
import { SmileOutlined, PlusCircleOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, reactive, ref, type UnwrapRef } from 'vue'
import { message, type SelectProps } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  addCategoryTagUsingPost,
  deleteCategoryTagUsingPost,
  listCategoryTagByPageUsingPost,
  updateCategoryTagUsingPost,
} from '@/api/categoryTagController'

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    align: 'center',
  },
  {
    title: '类型',
    dataIndex: 'type',
    // width: 80,
    align: 'center',
  },
  {
    title: '分类/标签名称',
    dataIndex: 'name',
    minWidth: 200,
    align: 'center',
  },
  {
    title: '使用数量',
    dataIndex: 'useNum',
    width: 100,
    align: 'center',
  },
  {
    title: '用户 id',
    dataIndex: 'userId',
    align: 'center',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 160,
    align: 'center',
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
    width: 160,
    align: 'center',
  },
  {
    title: '操作',
    dataIndex: 'operation',
    align: 'center',
    width: 160,
  },
]

const typeList = ref<SelectProps['options']>([
  { label: '分类', value: 0 },
  { label: '标签', value: 1 },
])

// 数据
const dataList = ref([])
const total = ref(0)

// 搜索条件
const searchParams = reactive<API.CategoryQueryRequest>({
  current: 1,
  pageSize: 10,
})

// 分页参数
const pagination = computed(() => {
  return {
    current: searchParams.current ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
  }
})

// 获取数据
const fetchData = async () => {
  const res = await listCategoryTagByPageUsingPost({
    ...searchParams,
  })
  if (res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

// 页面加载时请求一次
onMounted(() => {
  fetchData()
})

// 表格变化处理
const doTableChange = (page: any) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

// 获取数据
const doSearch = () => {
  // 重置页码
  searchParams.current = 1
  fetchData()
}

// 可编辑行
const editableData: UnwrapRef<Record<string, any>> = reactive({})
const edit = (key: string) => {
  editableData[key] = dataList.value.filter((item) => item.id === key)
}
const save = async (key: string) => {
  console.log('save ', key)
  console.log('editableData ', editableData[key][0])
  const res = await updateCategoryTagUsingPost(editableData[key][0])
  if (res.data.code === 0 && res.data.data) {
    message.success('修改成功')
  } else {
    message.error('修改失败，' + res.data.message)
  }
  cancel(key)
}
const cancel = (key: string) => {
  delete editableData[key]
}

// 删除数据
const doDelete = async (id: string) => {
  if (!id) {
    return
  }
  const res = await deleteCategoryTagUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('删除失败')
  }
}

// 新增弹出框
const addCategoryTagDialog = ref<boolean>(false)

const categoryForm = reactive<API.CategoryAddRequest>({})

// 创建分类标签
const doAddCategoryTag = async (values: any) => {
  const res = await addCategoryTagUsingPost(categoryForm)
  if (res.data.code === 0 && res.data.data) {
    message.success('创建成功')
  } else {
    message.error('创建失败，' + res.data.message)
  }
  addCategoryTagDialog.value = false
  // 刷新数据
  fetchData()
}
</script>

<style scoped>
#homePage {
}
</style>
