<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 유틸리티 라인 MSDS  -->

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import IMenuTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const menuTitle = ref(null);
const dialog = ref(false);
const popupParam = reactive({
  SaveData: {},
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  MATNO:''
})

const openPopup = (param) => {
  popupParam.SaveData = param
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  dialog.value = true
}

const searchData = () => {
  // console.log('조회')
  Promise.all([
      commonSearchApi({
        queryId : "HLTDA0010_SEARCH_04",
        param : searchParams
      })
  ]).then(async (res) => {
    // console.log('res ' , res.ORESULT_CUR)

    window.open('https://hises.hd.com/HiSEsFiles/' +
      res[0].ORESULT_CUR[0].FILE_PATH.replaceAll(/\\/g, '/') +
      res[0].ORESULT_CUR[0].FILE_NAME, '_blank')
    // window.open('https://hises.hd.com/HiSEsFiles/HSE/GAIS.HSE.IA.UI.UIIA1020C/MNIA110020/msds/202001/09f48c54-7f2a-4a7b-9c1e-08bddcdc16da.pdf', '_blank')
    // commonDownloadFilesApi(res[0].ORESULT_CUR[0].FILE_ID)
    // .then((res) => {
    //   consoel.log('11111111111111111111 : ' , res)
    //   //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    //   const file = res.contentDisposition.split('fileName="')
    //   const blob = new Blob([res])
    //   const blobUrl = URL.createObjectURL(blob)
    //   console.log('blobUrl : ' , blobUrl)
    //   //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
    //   // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
    //   const decodedFileName = decodeURI(file[1].replace('";', ''))
      // window.open(blobUrl, '_blank')
    //   URL.revokeObjectURL(blobUrl)
    // })
    // .catch((e) => {
    //   console.error('파일 여는 중 오류 발생',e)
    // })
  })
};

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnArgon') {
    // alert("아르곤")
    searchParams.MATNO = '164G3100175'
    searchData()
  } else if (btn.id === 'btnOxygen') {
    // alert("산소")
    searchParams.MATNO = '164A1000000'
    searchData()
  } else if (btn.id === 'btnCarbonDioxide') {
    // alert("이산화탄소")
    searchParams.MATNO = '164E1000000'
    searchData()
  } else if (btn.id === 'btnEthylene') {
    // alert("에틸렌")
    searchParams.MATNO = '164C1100000'
    searchData()
  } else if (btn.id === 'btnAcetylene') {
    // alert("아세틸렌")
    searchParams.MATNO = '164D1000000'
    searchData()
  } else if (btn.id === 'btnLiquefiedNaturalGas') {
    // alert("LNG(도시가스)")
    searchParams.MATNO = 'T000000009'
    searchData()
  }
}

const closePopup = () => {
  //searchSubData.value()
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="400"
    height="300"
    class="draggable-dialog"
  >
    <div class="title-bar" @mousedown="startDragging">
      <span> 유틸리티 라인 MSDS </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 인적사항 -->
      <v-card-text class="overflowY">
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
            <div>
              <div class="d-flex my-2">
                <IMenuTitle
                  ref="menuTitle"
                  :use-permission="false"
                  :button-list="['btnArgon','btnOxygen','btnCarbonDioxide']"
                  @click-button="onButtonsClick"
                />
              </div>
              <div class="d-flex my-2">
                <IMenuTitle
                  ref="menuTitle"
                  :use-permission="false"
                  :button-list="['btnEthylene','btnAcetylene','btnLiquefiedNaturalGas']"
                  @click-button="onButtonsClick"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
        <!-- 팝업 -->
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.fileDiv {
  width: 100%;
  padding: 12px;
  background: #fff;
}

.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
  width: 250px;
}
.box {
  background: #fff;
  padding: 8px;
  border-radius: 12px;
}
</style>
