<template>
  <div id="addPicturePage">
    <h2 style="margin-bottom: 16px">
      {{ route.query?.id ? '修改图片' : '创建图片' }}
    </h2>
    <!-- 选择上传方式 -->
    <a-tabs v-model:activeKey="uploadType"
      >>
      <a-tab-pane key="file" tab="文件上传">
        <PictureUpload :picture="picture" :onSuccess="onSuccess" />
      </a-tab-pane>
      <a-tab-pane key="url" tab="URL 上传" force-render>
        <UrlPictureUpload :picture="picture" :onSuccess="onSuccess" />
      </a-tab-pane>
    </a-tabs>
    <!-- 图片其他信息 -->
    <a-form layout="vertical" :model="pictureForm" @finish="handleSubmit">
      <a-form-item label="名称" name="name">
        <a-input v-model:value="pictureForm.name" placeholder="请输入名称" />
      </a-form-item>
      <a-form-item label="简介" name="introduction">
        <a-textarea
          v-model:value="pictureForm.introduction"
          placeholder="请输入简介"
          :rows="2"
          autoSize
          allowClear
        />
      </a-form-item>
      <a-form-item label="分类" name="category">
        <!--<a-auto-complete-->
        <!--  v-model:value="pictureForm.category"-->
        <!--  :options="categoryOptions"-->
        <!--  placeholder="请输入分类"-->
        <!--  allowClear-->
        <!--/>-->
        <!--<a-form-item label="标签" name="tags">-->
        <!--  <a-select-->
        <!--    v-model:value="pictureForm.tags"-->
        <!--    :options="tagOptions"-->
        <!--    mode="tags"-->
        <!--    placeholder="请输入标签"-->
        <!--    allowClear-->
        <!--  />-->
        <!--</a-form-item>-->
        <a-select
          v-model:value="pictureForm.category"
          :options="categoryOptions"
          placeholder="请输入分类"
          allowClear
        />
      </a-form-item>
      <a-form-item label="标签" name="tags">
        <a-select
          v-model:value="selectedTag"
          :options="tagOptions"
          mode="tags"
          placeholder="请输入标签"
          allowClear
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">
          {{ route.query?.id ? '修改' : '创建' }}
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import PictureUpload from '@/components/PictureUpload.vue'
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { editPictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController'
import { useRoute, useRouter } from 'vue-router'
import { pictureCategoryTagDataUsingGet } from '@/api/categoryTagController'
import UrlPictureUpload from '@/components/UrlPictureUpload.vue'

const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureEditRequest>({})
const uploadType = ref<'file' | 'url'>('file')

const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
  pictureForm.name = newPicture.name
}

// 分类和标签下拉框
const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])
// 标签下拉框的Value
const tagValue = ref<string[]>([])
// 标签下拉框的Label
const tagLabel = ref<string[]>([])

// 选择的标签
const selectedTag = ref<string[]>([])

const tagList = ref<string[]>([])
const inputTagList = ref<string[]>([])

const router = useRouter()

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  const pictureId = picture.value.id
  if (!pictureId) {
    return
  }
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
  values.tags = tagList.value
  values.inputTagList = inputTagList.value
  const res = await editPictureUsingPost({
    id: pictureId,
    ...values,
  })
  if (res.data.code === 0 && res.data.data) {
    message.success('创建成功')
    // 跳转到图片详情页
    router.push({
      path: `/picture/${pictureId}`,
    })
  } else {
    message.error('创建失败，' + res.data.message)
  }
}

// 获取标签和分类选项
const getTagCategoryOptions = async () => {
  // const res = await listPictureTagCategoryUsingGet()
  const res = await pictureCategoryTagDataUsingGet()
  if (res.data.code === 0 && res.data.data) {
    // 转换成下拉选项组件接受的格式
    /*tagOptions.value = (res.data.data.tagList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
    categoryOptions.value = (res.data.data.categoryList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })*/
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

const route = useRoute()

// 获取老数据
const getOldPicture = async () => {
  // 获取数据
  const id = route.query?.id
  if (id) {
    const res = await getPictureVoByIdUsingGet({
      id: id,
    })
    await getTagCategoryOptions()
    tagOptions.value.forEach((tag) => {
      tagLabel.value.push(tag.label)
    })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      picture.value = data
      pictureForm.name = data.name
      pictureForm.introduction = data.introduction
      pictureForm.category = data.categoryId
      pictureForm.tags = data.tagIds
      // // 处理标签数据的回填问题
      // const tagIds = []
      // tagLabel.value.forEach((tag, index) => {
      //   if (data.tags.includes(tag)) {
      //     tagIds.push(tagOptions.value[index].value)
      //   }
      // })
      // selectedTag.value = tagIds
      selectedTag.value = data.tagIds
    }
  }
}

onMounted(() => {
  getOldPicture()
})
</script>

<style scoped>
#addPicturePage {
  max-width: 720px;
  margin: 0 auto;
}
</style>
