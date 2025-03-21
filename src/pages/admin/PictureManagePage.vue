<template>
  <a-flex justify="space-between">
    <h2>图片管理</h2>
    <a-space>
      <a-button type="primary" href="/add_picture" target="_blank"><PlusCircleOutlined />创建图片</a-button>
      <a-button type="primary" href="/add_picture/batch"><PlusCircleOutlined />批量创建图片</a-button>
    </a-space>
  </a-flex>

  <!-- 搜索 -->
  <a-form layout="inline" :model="searchParams" @finish="doSearch">
    <a-form-item label="关键词" name="searchText">
      <a-input v-model:value="searchParams.searchText" placeholder="从名称和简介搜索" allow-clear />
    </a-form-item>
    <a-form-item label="类型" name="category">
      <!--<a-input v-model:value="searchParams.category" placeholder="请输入类型" allow-clear />-->
      <a-select
        v-model:value="searchParams.category"
        :options="categoryOptions"
        placeholder="请选择分类"
        style="min-width: 180px"
        allowClear
      />
    </a-form-item>
    <a-form-item label="标签" name="tags">
      <a-select
        v-model:value="searchParams.tags"
        mode="tags"
        :options="tagOptions"
        placeholder="请选择标签"
        style="min-width: 180px"
        allow-clear
      />
    </a-form-item>
    <a-form-item label="审核状态" name="reviewStatus">
      <a-select
        v-model:value="searchParams.reviewStatus"
        :options="PIC_REVIEW_STATUS_OPTIONS"
        placeholder="请输入审核状态"
        style="min-width: 180px"
        allow-clear
      />
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
    :scroll="{ x: 1300}"
  >
    <template #headerCell="{ column }">
      <template v-if="column.key === 'name'">
        <span>
          <smile-outlined />
          Name
        </span>
      </template>
    </template>

    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'url'">
        <a-image :src="record.url" :width="120" />
      </template>
      <!-- 标签 -->
      <template v-if="column.dataIndex === 'tags'">
        <a-space wrap>
          <a-tag v-for="tag in JSON.parse(record.tags || '[]')" :key="tag">{{ tag }}</a-tag>
        </a-space>
      </template>
      <!-- 图片信息 -->
      <template v-if="column.dataIndex === 'picInfo'">
        <div>格式：{{ record.picFormat }}</div>
        <div>宽度：{{ record.picWidth }}</div>
        <div>高度：{{ record.picHeight }}</div>
        <div>宽高比：{{ record.picScale }}</div>
        <div>大小：{{ (record.picSize / 1024).toFixed(2) }}KB</div>
      </template>
      <!-- 审核信息 -->
      <template v-if="column.dataIndex === 'reviewMessage'">
        <div>审核状态：<a-tag :color="PIC_STATUS_TAG_COLOR[record.reviewStatus]">{{ PIC_REVIEW_STATUS_MAP[record.reviewStatus] }}</a-tag></div>
        <div v-if="record.reviewMessage">审核信息：{{ record.reviewMessage }}</div>
        <div v-if="record.reviewerId">审核人：{{ record.reviewerId }}</div>
        <div v-if="record.reviewTime">审核时间：{{ dayjs(record.reviewTime).format('YYYY-MM-DD HH:mm:ss') }}</div>
      </template>
      <template v-else-if="column.dataIndex === 'createTime'">
        {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
      </template>
      <template v-else-if="column.dataIndex === 'editTime'">
        {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
      </template>
      <template v-else-if="column.key === 'action'">
        <a-space wrap>
          <a-button
            v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.PASS"
            type="link"
            @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.PASS)"
          >
            通过
          </a-button>
          <a-button
            v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.REJECT"
            type="link"
            danger
            @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.REJECT)"
          >
            拒绝
          </a-button>
          <a-button type="link" :href="`/add_picture?id=${record.id}`" target="_blank"
            >编辑
          </a-button>
          <a-button type="link" danger @click="doDelete(record.id)">删除</a-button>
        </a-space>
      </template>
    </template>
  </a-table>
</template>
<script lang="ts" setup>
import { SmileOutlined, DownOutlined, PlusCircleOutlined } from '@ant-design/icons-vue'
import { deleteUserUsingPost, listUserVoByPageUsingPost } from '@/api/userController'
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { deletePictureUsingPost, doPictureReviewUsingPost, listPictureByPageUsingPost } from '@/api/pictureController'
import { pictureCategoryTagDataUsingGet } from '@/api/categoryTagController'
import {
  PIC_REVIEW_STATUS_ENUM,
  PIC_REVIEW_STATUS_MAP,
  PIC_REVIEW_STATUS_OPTIONS,
  PIC_STATUS_TAG_COLOR
} from '@/constants/picture'

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
  },
  {
    title: '图片',
    dataIndex: 'url',
  },
  {
    title: '名称',
    dataIndex: 'name',
  },
  {
    title: '简介',
    dataIndex: 'introduction',
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'category',
  },
  {
    title: '标签',
    dataIndex: 'tags',
  },
  {
    title: '图片信息',
    dataIndex: 'picInfo',
  },
  {
    title: '用户 ID',
    dataIndex: 'userId',
  },
  {
    title: '审核信息',
    dataIndex: 'reviewMessage',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    align: 'center',
    width: 200,
  },
]
// 数据
const dataList = ref([])
const total = ref(0)

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
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
  const res = await listPictureByPageUsingPost({
    ...searchParams,
    nullSpaceId: true,
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

// 获取数据
const doSearch = () => {
  // 重置搜索条件
  searchParams.current = 1
  fetchData()
}

// 表格变化处理
const doTableChange = (page: any) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

// 删除数据
const doDelete = async (id: string) => {
  if (!id) {
    return
  }
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('删除失败')
  }
}


// 分类和标签下拉框
const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])

// 获取标签和分类选项
const getTagCategoryOptions = async () => {
  const res = await pictureCategoryTagDataUsingGet()
  if (res.data.code === 0 && res.data.data) {
    // 转换成下拉选项组件接受的格式
    tagOptions.value = (res.data.data.tagVOList ?? []).map((data: API.CategoryTagVO) => {
      return {
        value: data.id,
        label: data.name,
      }
    })
    categoryOptions.value = (res.data.data.categoryVOList ?? []).map((data: API.CategoryTagVO) => {
      return {
        value: data.id,
        label: data.name,
      }
    })
  } else {
    message.error('加载选项失败，' + res.data.message)
  }
}

onMounted(() => {
  getTagCategoryOptions()
})

const handleReview = async (record: API.Picture, reviewStatus: number) => {
  const reviewMessage = reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS ? '管理员操作通过' : '管理员操作拒绝'
  const res = await doPictureReviewUsingPost({
    id: record.id,
    reviewStatus,
    reviewMessage,
  })
  if (res.data.code === 0) {
    message.success('审核操作成功')
    // 重新获取列表
    fetchData()
  } else {
    message.error('审核操作失败，' + res.data.message)
  }
}

</script>

<style scoped>
#homePage {
}
</style>
