
/**
 * 단기공사 전용 
 * 파일 첨부 기능
 * 김우빈
 */

import Compressor from "compressorjs"
import _ from "lodash"
import {
  commonDownloadFilesApi,
  commonDeletFilesApi,
  commonBigUploadFilesApi,
  commonUploadFilesApi,
} from "@hiway/api/commonFileApi";
import { useI18n } from "vue-i18n"
import { useCommonStore } from "@hiway/stores/common";
import { useRoute } from "vue-router";

import Message from '@hiway/utils/notify'


//파일 선택
//파일 형식?
const fileTypes = false ? "jpg,gif,bmp,png,jpeg"
: "jpg,png,jpeg,ppt,doc,pdf,docx,xlsx,pptx"

//파일 읽어오기
export const selectFile = (e, imgOnly, maxFileSize) => {
  
  // const t = useI18n().t; //다국어
  const fTypes = imgOnly ? "jpg,gif,bmp,png,jpeg"
  : "jpg,png,jpeg,ppt,doc,pdf,docx,xlsx,pptx"

  const uploadFiles = [{
    fileName: '',
    file: '',
    fileData: '',
  }]
  const returnResult = []
  let fileData = {}
  for (let file of e) {

    const fType = file.name.split(".").pop().toUpperCase()
    const fUseType = fTypes.split(",").map((item) => {
      return item.toUpperCase()
    })
    
    if (file.size >= maxFileSize * 1024 * 1024) {
      Message.err(maxFileSize + "MB 이상 첨부파일은 등록 불가능 합니다." + "<br>" + file.name)
      return
    } else if (!_.includes(fUseType, fType)) {
      const msg = imgOnly ? "이미지만 업로드 가능합니다." : "사용할 수 없는 파일입니다."
      Message.err(msg + "<br>" + file.name                                                                                   )
      return
    }
  }

  for (let file of e) {
     
    const fType = file.name.split(".").pop().toUpperCase()

    //이미지 파일 등록.
    if (fType === "PNG" || fType === "JPG" || fType === "JPEG" || fType === "BMP" || fType === "GIF") {
      new Compressor(file, {
        convertSize: 1000000, // 1MB
        quality: 0.8,
        success(result) {
          fileData = {
            FILE_NAME: result.name,
            FILE_NAME_ORIGINAL: result.name,
            FILE_SIZE: Math.round(result.size / 1024.0),
            PROGRESS: 0,
            FILE_PATH: "",
            STATUS: "N",
            SEND_PATH: "",
            FILE_TITLE: result.name,
            FILE_TYPE: "",
          }

          uploadFiles[0].fileName = file.name;
          uploadFiles[0].file = file;
          uploadFiles[0].fileData = fileData;
        },
      })
    } else {
      fileData = {
        FILE_NAME: file.name,
        FILE_NAME_ORIGINAL: file.name,
        FILE_SIZE: Math.round(file.size / 1024.0),
        PROGRESS: 0,
        FILE_PATH: "",
        STATUS: "N",
        SEND_PATH: "",
        FILE_TITLE: file.name,
        FILE_TYPE: "",
      }

        uploadFiles[0].fileName = file.name;
        uploadFiles[0].file = file;
        uploadFiles[0].fileData = fileData;
     }
  }

  // returnResult = Array.from(uploadFiles)

  console.log('uploadFiles ', uploadFiles)
  console.log('returnResult ', returnResult)
  

  return uploadFiles
}

//파일 업로드
export const setFileUpload = async (guid,getFileData, path ,sysCode, bizNo) => {

  let checkedRow = getFileData

  if (checkedRow.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }
  console.log('checkedRow ', checkedRow)

    // 파일을 하나씩 처리

    //다중 파일 처리를 위한 for 구문으로 판단됨.
    for (let i = 0; i < checkedRow.length; i++) {

      const file = _.find(getFileData, { 
        fileName: checkedRow[i].fileData.FILE_TITLE
      }).file

      // 자르는 사이즈
      const chunkSize = 1024 * 1024 // 1MB
      // total size 계산
      const totalChunks = Math.ceil(file.size / chunkSize)
      
      let currentChunk = 0
      
      const sendNextFile = async () => {
      // chunk size 만큼 데이터 분할
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)

        // form data 형식으로 전송
        const formData = new FormData()

        const param = {
          CMPNY_DIV: 'VENDER',
          FILE_ID: guid,
          FILE_NO: "",
          FILE_TITLE: file.name,
          FILE_NAME_ORIGINAL: file.name,
          FILE_NAME: file.name,
          FILE_PATH: `${sysCode}${path}/`,
          FILE_TYPE: file.name.split(".").pop(),
          FILE_SIZE: Math.round(file.size / 1024.0),
          USER_ID: bizNo,
          CHUNK_NUMBER: currentChunk,
          TOTAL_CHUNKS: totalChunks,
        }

        formData.append("file", chunk, file.name)
        formData.append(
          "param",
           new Blob([JSON.stringify(param)], { type: "application/json" })
        );

        console.log('formData ', formData)

        await commonBigUploadFilesApi(formData)
          .then(async (res) => {
            // 전송 결과가 207이면 다음 파일 조각 전송
            if (res.result.status === "207") {

              if (currentChunk < totalChunks) {
                await sendNextFile();
              }
            } else if (res.result.status === "200") {

              Message.success("업로드 되었습니다.")
            }
          })
          .catch((e) => {
            console.log('erorr ', e)
            hasErr = true;
          });
      };

      await sendNextFile(); 
    }
}

//파일 업로드
export const setFileUpload2 = async (getFileData, path ,sysCode, bizNo ,msgFlag) => {

  let setData = []

  for (let i = 0; i < getFileData.length; i++){

    if (getFileData[i].UUID != undefined) {
      
      setData.push(getFileData[i])
    }
  }

  console.log('getFileData ', getFileData)

  console.log('setData ', setData)


  let checkedRow = setData

  if (checkedRow.length === 0) {
    // Message.err("선택된 데이터가 없습니다.")

    return
  }

  for (let file of setData) {

    // console.log('file ', file)

    const fType = file.file.name.split(".").pop().toUpperCase()
    const fUseType = fileTypes.split(",").map((item) => {
      return item.toUpperCase()
    })
    
    // if (file.size >= maxFileSize * 1024 * 1024) {
    //   Message.err(maxFileSize + "MB 이상 첨부파일은 등록 불가능 합니다." + "<br>" + file.name)
    //   return
    // } else
    if (!_.includes(fUseType, fType)) {
      const msg = "사용할 수 없는 파일입니다."
      Message.err(msg + "<br>" + file.name                                                                                   )
      return
    }
  }

  console.log('checkedRow ', checkedRow)

    // 파일을 하나씩 처리
    //무엇을 위해 있는건지 파악필요
    let hasErr = false;
    //다중 파일 처리를 위한 for 구문으로 판단됨.
  for (let i = 0; i < checkedRow.length; i++) {

    if (checkedRow[i].fileData === undefined) {
      return;
    }
      
      const file = _.find(getFileData, { 
        fileName: checkedRow[i].fileData.FILE_TITLE
      }).file

      // 자르는 사이즈
      const chunkSize = 1024 * 1024 // 1MB
      // total size 계산
      const totalChunks = Math.ceil(file.size / chunkSize)
      
      let currentChunk = 0
      
      const sendNextFile = async () => {
      // chunk size 만큼 데이터 분할
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)

        // form data 형식으로 전송
        const formData = new FormData()

        const param = {
          CMPNY_DIV: 'VENDER',
          FILE_ID: checkedRow[i].UUID,
          FILE_NO: "",
          FILE_TITLE: file.name,
          FILE_NAME_ORIGINAL: file.name,
          FILE_NAME: file.name,
          FILE_PATH: `${sysCode}${path}/`,
          FILE_TYPE: file.name.split(".").pop(),
          FILE_SIZE: Math.round(file.size / 1024.0),
          USER_ID: bizNo,
          CHUNK_NUMBER: currentChunk,
          TOTAL_CHUNKS: totalChunks,
        }

        formData.append("file", chunk, file.name)
        formData.append(
          "param",
           new Blob([JSON.stringify(param)], { type: "application/json" })
        );

        await commonBigUploadFilesApi(formData)
          .then(async (res) => {
            // 전송 결과가 207이면 다음 파일 조각 전송
            if (res.result.status === "207") {
              currentChunk++
              if (currentChunk < totalChunks) {
                await sendNextFile();
              }
            } else if (res.result.status === "200") {
              if (msgFlag) {
                if ( Number(checkedRow.length - 1) === i) {
                  //마지막 파일 올라갈때 업로드 메세지 처리;
                  Message.success("업로드 되었습니다.")
                }
              }
            }
          })
          .catch((e) => {
            console.log('erorr ', e)
            hasErr = true;
          });
      };

      await sendNextFile(); 
    }
}

export const create_UUID = () => {
  let dt = new Date().getTime();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const downloadFile = (idx) => {
  const currRow = grdMain.value.getDataProvider().getJsonRow(idx)

  commonDownloadFilesApi(currRow)
    .then((res) => {
      console.log('res ', res)
      //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      //const file = res.contentDisposition.split('fileName=')
      const file = res.contentDisposition.split('fileName="')
      console.log('file ', file)
      const blob = new Blob([res])
      console.log('blob ', blob)
      const link = document.createElement("a")

      link.href = URL.createObjectURL(blob)

      //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
      //link.download = file[1])
      link.download = decodeURI(file[1].replace('";', ""))
      link.click()
      URL.revokeObjectURL(link.href)
      grdMain.value.getDataProvider().setValue(idx, "PROGRESS", 100)
      grdMain.value.getDataProvider().setValue(idx, "STATUS", "D")
    })
    .catch((e) => {
      // console.log('e', e)
      grdMain.value.getDataProvider().setValue(idx, "PROGRESS", 0)
      grdMain.value.getDataProvider().setValue(idx, "STATUS", "E")
    })
}

export const downloadFile2 = (idx) => {
  console.log('idx ', idx)
  // commonDownloadFilesApi(currRow)
  //   .then((res) => {
  //     console.log('res ', res)
  //     //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
  //     //const file = res.contentDisposition.split('fileName=')
  //     const file = res.contentDisposition.split('fileName="')
  //     console.log('file ', file)
  //     const blob = new Blob([res])
  //     console.log('blob ', blob)
  //     const link = document.createElement("a")

  //     link.href = URL.createObjectURL(blob)

  //     //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
  //     // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
  //     //link.download = file[1])
  //     link.download = decodeURI(file[1].replace('";', ""))
  //     link.click()
  //     URL.revokeObjectURL(link.href)
  //     grdMain.value.getDataProvider().setValue(idx, "PROGRESS", 100)
  //     grdMain.value.getDataProvider().setValue(idx, "STATUS", "D")
  //   })
  //   .catch((e) => {
  //     // console.log('e', e)
  //     grdMain.value.getDataProvider().setValue(idx, "PROGRESS", 0)
  //     grdMain.value.getDataProvider().setValue(idx, "STATUS", "E")
  //   })
}