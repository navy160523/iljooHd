<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonUploadFilesApi, commonDeletFilesApi, jsonToFormData, commonDownloadFilesApi, commonBigUploadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'


defineOptions({
  name: 'UploadTest',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const files = ref(null)
const fileList = ref([])

//조회조건
let searchParams = reactive({
  CMPNY_DIV: userStore.company,
  FILE_ID: 'T2023-001',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } , checkBar: { visible: true } },
  keys : [],
  fields : [ 
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV') }, visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일ID') }, visible: false },
    { fieldName: 'FILE_NO', dataType: 'text', header: { text: t('파일번호') }, visible: false },
    { fieldName: 'FILE_PATH', dataType: 'text', header: { text: t('파일경로') }, visible: false },
    { fieldName: 'FILE_NAME', dataType: 'text', header: { text: t('실제파일명') }, visible: false },
    { fieldName: 'FILE_TITLE', dataType: 'text', header: { text: t('제목') } },
    { fieldName: 'FILE_NAME_ORIGINAL', dataType: 'text', header: { text: t('파일명') } },
    { fieldName: 'FILE_SIZE', dataType: 'text', header: { text: t('크기(KB)') } },
    { fieldName: 'FILE', dataType: 'object', objectKey: 'value', header: { text: t('byte') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//초기 데이터셋팅
onMounted(() => {
  
})

//메뉴버튼
const onButtonsClick = btn => {

  if (btn.id === 'btnSearch')
  {    
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if (btn.id === 'btnDelete') {

    let chekedRow = grdMain.value.getGridView().getCheckedRows()
    let data = []
    if(chekedRow.length === 0){
      Message.err(t('선택된 데이터가 없습니다.'))

      return
    }
    chekedRow.forEach(val => {
      data.push(grdMain.value.getDataProvider().getJsonRow(val))
    })

    commonDeletFilesApi( data ).finally(()=>{
      Message.success(t('삭제 되었습니다.'))
      onButtonsClick( { id: 'btnSearch' } )
    })

  }else if(btn.id === 'btnFileUpload2'){

    let checkedRow = grdMain.value.getGridView().getCheckedItems()
    let checkedData = []

    for(let rowNum of checkedRow) {
      checkedData.push(grdMain.value.getDataProvider().getJsonRow(rowNum))
    }

    let file = files._rawValue
    let formData = new FormData()
    
    const param = {
      CMPNY_DIV: userStore.company,
      FILE_ID: '',
      FILE_NO: '',
      FILE_TITLE: '',
      FILE_NAME_ORIGINAL: '',
      FILE_NAME: '',
      FILE_PATH: '',
      FILE_TYPE: '',
      FILE_SIZE: '',
      USER_ID: userStore.userId,
    }

    for(let i = 0; i < file.length; i++){
      const fileType = file[i].name.split('.')

      formData.append('file' , file[i])
      param.FILE_TYPE = fileType[1]
      param.FILE_SIZE = file[i].size
    }

    formData.append('param', new Blob([ JSON.stringify(param) ], { type : "application/json" }))
    
    commonUploadFilesApi( formData ).finally(()=>{
      Message.success(t('업로드 되었습니다.'))
      onButtonsClick( { id: 'btnSearch' } )
    })
  }else if(btn.id === 'btnFileUpload'){
    // 파일
    let file = files._rawValue

    // 진행 퍼센트
    const resultElement = document.getElementById("result")

    // 파일을 하나씩 처리
    for(let i = 0; i < file.length; i++){
      // 자르는 사이즈
      const chunkSize = 1024 * 1024 // 1MB
      // total size 계산
      const totalChunks = Math.ceil(file[i].size / chunkSize)

      // 진행 퍼센트바 초기화
      resultElement.textContent = ''

      let currentChunk = 0

      const sendNextFile = () => {
        // chunk size 만큼 데이터 분할
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, file[i].size)
        const chunk = file[i].slice(start, end)

        // form data 형식으로 전송
        const formData = new FormData()

        const param = {
          CMPNY_DIV: userStore.company,
          FILE_ID: '',
          FILE_NO: '',
          FILE_TITLE: '',
          FILE_NAME_ORIGINAL: '',
          FILE_NAME: '',
          FILE_PATH: '',
          FILE_TYPE: '',
          FILE_SIZE: '',
          USER_ID: userStore.userId,
          CHUNK_NUMBER : '',
          TOTAL_CHUNKS : '',
        }
        
        param.FILE_SIZE = file[i].size
        param.CHUNK_NUMBER = currentChunk
        param.TOTAL_CHUNKS = totalChunks

        formData.append('file', chunk,file[i].name)
        formData.append('param', new Blob([ JSON.stringify(param) ], { type : "application/json" }))

        commonBigUploadFilesApi( formData ).then(res => {

          console.log(res.FILE_ID)

          // 전송 결과가 207이면 다음 파일 조각 전송
          if (res.result.status === '207') {

            // 진행률 표시
            resultElement.textContent = Math.round(currentChunk / totalChunks * 100) + "%"
            currentChunk++
            if (currentChunk < totalChunks) {
              sendNextFile()
            }
          } else if (res.result.status === '200') {
            // 마지막 파일까지 전송 되면 
            resultElement.textContent = '업로드 되었습니다'
            Message.success(t('업로드 되었습니다.'))
          }
        })
      }
      
      sendNextFile()

    }
  }else if(btn.id === 'btnDownLoad'){
    let chekedRow = grdMain.value.getGridView().getCheckedRows()
    if(chekedRow.length === 0){
      Message.err(t('선택된 데이터가 없습니다.'))

      return
    }
    chekedRow.forEach(val => {
      commonDownloadFilesApi( grdMain.value.getDataProvider().getJsonRow(val) ).then(res => {

        //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
        //const file = res.contentDisposition.split('fileName=')
        const file = res.contentDisposition.split('fileName=\"')
        const blob = new Blob([res])
        const link = document.createElement('a')

        link.href = URL.createObjectURL(blob)

        //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
        // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
        //link.download = file[1])
        link.download = decodeURI(file[1].replace('\";',''))
        link.click()
        URL.revokeObjectURL(link.href)
      })
    })
  }
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  
  return true
}

// 조회로직
const searchData = () => {

  return commonSearchApi({ queryId : 'UIZZ1030C_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res)
}

const getBase64 = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

const selectFile = e => {

  // for(let file of e) {
    
  //   getBase64(file).then(res => {

  //     // console.log('res', res)

  //     let data = {
  //       FILE_TITLE: file.name,
  //       FILE_NAME_ORIGINAL: file.name,
  //       FILE_SIZE: file.size / 1024,
  //       FILE: { value : res },
  //     }

  //     grdMain.value.addRow(data)

  //   })
  // }

  //let fileName = file._rawValue[0].name.split('.')

}
</script>

<template>
  <VContainer
    class="pt-0"
  >
    <VRow>
      <VCol>
        <IMenuTitle
          ref="menuTitle"
          :title="$t(useLogsStore().menuId)"
          :button-list="['btnSearch','btnFileUpload', 'btnDownLoad','btnDelete']"
          @click-button="onButtonsClick"
        />
      </VCol>
    </VRow>
    <!-- 조회조건 -->
    <VRow>
      <VCol>        
        <v-file-input 
          label="여기에 파일을 끌어다 놓으세요."
          clearable
          multiple
          @update:modelValue="selectFile" 
          v-model="files" 
        />
      </VCol>
    </VRow>
    <div id="result"></div>
    <!-- 메인그리드 -->
    <VRow no-gutters>
      <VCol>
        <IGridTitle :title="$t('')">
          <template #editors />
        </IGridTitle>
        <RealGrid
          ref="grdMain"
          class="mt-2"
          style="height: 550px;"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys" 
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
        />
      </VCol>
    </VRow>
  </VContainer>
</template>