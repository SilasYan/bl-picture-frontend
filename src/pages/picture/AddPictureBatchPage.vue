<template>
  <div id="addPictureBatchPage">
    <h2 style="margin-bottom: 16px">批量创建图片</h2>
    <a-form layout="vertical" :model="formData" @finish="handleSubmit">
      <a-form-item label="关键词" name="searchText">
        <a-input v-model:value="formData.searchText" placeholder="请输入关键词" />
      </a-form-item>
      <a-form-item label="名称前缀" name="namePrefix">
        <a-input v-model:value="formData.namePrefix" placeholder="请输入名称前缀，会自动补充序号" />
      </a-form-item>
      <a-form-item label="抓取数量" name="count">
        <a-input-number
          v-model:value="formData.count"
          placeholder="请输入数量"
          style="min-width: 180px"
          :min="1"
          :max="30"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="分类" name="category">
        <a-select
          v-model:value="formData.category"
          :options="categoryOptions"
          placeholder="请选择分类"
          allowClear
        />
      </a-form-item>
      <a-form-item label="标签" name="tags">
        <a-select
          v-model:value="selectedTag"
          :options="tagOptions"
          mode="tags"
          placeholder="请选择/输入标签"
          allowClear
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%" :loading="loading">
          执行任务
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { uploadPictureByBatchUsingPost } from '@/api/pictureController'
import { pictureCategoryTagDataUsingGet } from '@/api/categoryTagController'

const router = useRouter()

const formData = reactive<API.PictureUploadByBatchRequest>({
  count: 10,
})
const loading = ref(false)

// 分类和标签下拉框
const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])
// 标签下拉框的Value
const tagValue = ref<string[]>([])
// 选择的标签
const selectedTag = ref<string[]>([])

const tagList = ref<string[]>([])
const inputTagList = ref<string[]>([])

const handleSubmit = async (values: any) => {
  loading.value = true

  // 处理手动输入的标签, 如果在查询出来的标签下拉框中匹配不到，则添加到 inputTagList 中
  tagOptions.value.forEach((tag) => {
    tagValue.value.push(tag.value)
  })
  selectedTag.value.forEach((tag) => {
    if (!tagValue.value.includes(tag)) {
      inputTagList.value.push(tag)
    } else {
      tagList.value.push(tag)
    }
  })
  formData.tags = tagList.value
  formData.inputTagList = inputTagList.value

  const res = await uploadPictureByBatchUsingPost({
    ...formData,
  })
  if (res.data.code === 0 && res.data.data) {
    message.success(`创建成功，共 ${res.data.data} 条`)
    router.push({
      path: '/',
    })
  } else {
    message.error('创建失败，' + res.data.message)
  }
  loading.value = false
}

//
// /**
//  * 提交表单
//  * @param values
//  */
// const handleSubmit = async (values: any) => {
//   const pictureId = picture.value.id
//   if (!pictureId) {
//     return
//   }
//   // 处理手动输入的标签, 如果在查询出来的标签下拉框中匹配不到，则添加到 inputTagList 中
//   tagOptions.value.forEach((tag) => {
//     tagValue.value.push(tag.value)
//   })
//   selectedTag.value.forEach((tag) => {
//     if (!tagValue.value.includes(tag)) {
//       inputTagList.value.push(tag)
//     } else {
//       tagList.value.push(tag)
//     }
//   })
//   values.tags = tagList.value
//   values.inputTagList = inputTagList.value
//   const res = await editPictureUsingPost({
//     id: pictureId,
//     ...values,
//   })
//   if (res.data.code === 0 && res.data.data) {
//     message.success('创建成功')
//     // 跳转到图片详情页
//     router.push({
//       path: `/picture/${pictureId}`,
//     })
//   } else {
//     message.error('创建失败，' + res.data.message)
//   }
// }

// 获取标签和分类选项
const getTagCategoryOptions = async () => {
  const res = await pictureCategoryTagDataUsingGet()
  if (res.data.code === 0 && res.data.data) {
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
</script>

<style scoped>
#addPictureBatchPage {
  max-width: 720px;
  margin: 0 auto;
}
</style>
