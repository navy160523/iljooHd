import request from "@/utils/request"

//공통 파일업로드
export function commonUploadFilesApi(data) {
  
  return request({
    url: "/hse/file/uploadFiles",
    headers: { 'Content-Type': 'multipart/form-data;charset=utf8' },
    method: "post",
    meta: null,
    data,
    // contentType: false,               // * 중요 *
    processData: false,               // * 중요 *
    // enctype : 'multipart/form-data',  // * 중요 *
  })
}

//공통 파일업로드
export function commonBigUploadFilesApi(data) {
  return request({
    url: "/hse/file/bigUploadFiles",
    headers: { 'Content-Type': 'multipart/form-data;charset=utf8' },
    method: "post",
    meta: {
      useErrorMessage: false,
    },
    data,
    // contentType: false,               // * 중요 *
    processData: false,               // * 중요 *
    // enctype : 'multipart/form-data',  // * 중요 *
  })
}

//공통 파일다운로드
export function commonDownloadFilesApi(data) {

  return request({
    url: '/hse/file/downloadFiles',
    method: 'post',
    meta: {
      getContentDisposition: true,
      useErrorMessage: false,
    },
    data,
    responseType: "blob",
  })
}

//공통 셈플 파일
export function commonSampleDownFilesApi(data) {

  return request({
    url: '/hse/file/sampleDown',
    method: 'post',
    meta: {
      getContentDisposition: true,
      useErrorMessage: false,
    },
    data,
    responseType: "blob",
  }).then((res) => {
    //const file = res.contentDisposition.split('fileName=')
    const file = res.contentDisposition.split('fileName="')
    const blob = new Blob([res])
    const link = document.createElement("a")

    link.href = URL.createObjectURL(blob)

    //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
    //link.download = file[1])
    link.download = decodeURI(file[1].replace('";', ""))
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

//공통 파일삭제
export function commonDeletFilesApi(data) {

  return request({
    url: "/hse/file/deletFiles",
    headers: { "Content-Type": "application/json" },
    method: "post",
    data,
  })
}

export function commonDeleteAllFilesApi(data) {

  return request({
    url: "/hse/file/deleteAllFiles",
    headers: { "Content-Type": "application/json" },
    method: "post",
    data,
  })
}

export function jsonToFormData (jsonData) {

  let arrData = new Array()

  for(let data of jsonData) {    

    let formData = new FormData()
    
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value)
    }
  
    arrData.push(formData)
  }

  return arrData
}

