// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** pictureCategoryTagData GET /api/categoryTag/data/vo */
export async function pictureCategoryTagDataUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponsePictureTagCategory_>('/api/categoryTag/data/vo', {
    method: 'GET',
    ...(options || {}),
  })
}
