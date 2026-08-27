<!--
  화면명 : 메뉴얼 관리 등록/상세
  화면개요 : 메뉴얼 관리에 있는 게시물을 등록/수정한다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useMenuStore } from '@hiway/stores/menu'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import IUpload from "@/components/IUpload.vue"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const fileUploadButton = reactive(["btnDownLoad", "btnDelete"])
const fileVisible = ref(false) //파일업로드 visible 플래그
const emit = defineEmits(['after-search'])
const isCreate = ref(false)
const menuStore = useMenuStore()

const props = defineProps({
  id: {
    Type: String,
    required: true,
  },
})

const searchParam = reactive({
  CMPNY_DIV: '',
  NOTICE_DIV: 'DATCA0070',
  NOTICE_NO: '',
})

const treeData = reactive({
  children: menuStore.treeMenus
})

/* 게시 기간 */
const dtPeriod = reactive([
  { COD: 'A', TXT: '영구' },
  { COD: '7', TXT: '7일' },
  { COD: '15', TXT: '15일' },
  { COD: '30', TXT: '30일' },
  { COD: '90', TXT: '90일' },
])

const saveParam = reactive([
  {
    CMPNY_DIV: '',
    FILE_CNT: '',
    INSERT_DATE: '',
    KOR_NM: '',
    NOTICE_CNT: '',
    NOTICE_FILEID: '',
    NOTICE_NO: '',
    NOTICE_NOTE: '',
    NOTICE_PERIOD: '',
    NOTICE_POPUP: '',
    NOTICE_RANGE: '',
    NOTICE_REG_EMPNO: '', //실제로 DB에 넘어가는 유저 코드
    NOTICE_TAG: '',
    NOTICE_TITLE: '',
    USER_ID: '',
    NOTICE_DIV: '',
    CATEGORY1: '',
    CATEGORY2: '',
    NOTICE_FILEID: '',
    NOTICE_FILEID_ORG: '',
  },
])

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false }, edit: { editable: false }},
  keys : ['menu_id', 'mnu_nm'],
  fields : [ 
    
    { fieldName: 'mnu_nm', dataType: 'text', width: '30', header: { text: t('메뉴명') }, styleName: 'left-column', width : '150' },
    { fieldName: 'path', dataType: 'text', width: '30', header: { text: t('경로') }, styleName: 'left-column', width : '150' },
    { fieldName: 'menulevel', dataType: 'text', width: '30', header: { text: t('메뉴레벨') }, styleName: 'right-column', width : '30' },
    
    { fieldName: 'menu_id', dataType: 'text', width: '120', header: { text: t('메뉴코드') }, styleName: 'left-column', width : '100', visible: false},
    { fieldName: 'prnt_menu_id', dataType: 'text', width: '120', header: { text: t('상위메뉴'), styleName: 'header_validit' }, styleName: 'left-column', visible : false } ,
    { fieldName: 'app_id', dataType: 'text', width: '103', header: { text: t('app_id') }, styleName: 'left-column', width : '60', visible : false },
    { fieldName: 'sort', dataType: 'text', width: '103', header: { text: t('정렬') }, styleName: 'left-column', width : '60', visible : false },
    { fieldName: 'mnu_seq', dataType: 'text', width: '30', header: { text: t('seq') }, styleName: 'right-column', width : '60', visible: false },
    
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (gbn) => {
  if (gbn.NOTICE_NO) {
    /* ********************* 기존 저장 데이터 ******************* */
    for (let i in searchParam) {
      for (let j in gbn) {
        if (i === j) {
          searchParam[i] = gbn[j]
        }
      }
    }
    searchParam.NOTICE_DIV = 'DATCA0070'

    menuTitle.value.disableBtn('btnDelete', false)
    search()
  } else {
    /* ********************* 신규 등록 ******************* */
    saveParam[0].NOTICE_DIV = 'DATCA0070'
    saveParam[0].INSERT_DATE = dayjs(new Date()).format('YYYY-MM-DD')
    saveParam[0].NOTICE_PERIOD = 'A'
    saveParam[0].NOTICE_CNT = 0
    saveParam[0].KOR_NM = userStore.userName
    saveParam[0].CMPNY_DIV = userStore.cmpnyDiv
    saveParam[0].USER_ID = userStore.userId

    menuTitle.value.disableBtn('btnDelete', true)
  }
  dialog.value = true  
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  saveParam[0].CATEGORY1 = data.path
  saveParam[0].CATEGORY2 = data.mnu_nm
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    saveParam[0].NOTICE_NOTE = ckEditor.value.getContent() //ck에디터에 입력한 내용을 html태그로 변환해서 넣어줌

    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(closePopup).run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(closePopup).run()
  } else {
    closePopup()
  }
}

/* ******************************* 조회 ***************************** */
const search = () => {
  //DATCA0030이랑 같은 API사용함
  commonRequest('/hse/data/DATCA0070_SEARCH_02', { queryId: 'DATCA0070_SEARCH_02', param: searchParam })
    .then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        for (let i in saveParam[0]) {
          for (let j in res.ORESULT_CUR[0]) {
            if (i === j) {
              saveParam[0][i] = res.ORESULT_CUR[0][j]

              if (i === "NOTICE_NOTE") {
                ckEditor.value.setContent(res.ORESULT_CUR[0][j])
              }
            }
          }
        }
      }
    })
    .finally(() => {
      /* ****************** 조회건수 저장 ****************** */
      commonExecuteApi({ queryId: "DATCA0070_SAVE_02", list: saveParam })
      checkFileId()
    })
}

// 파일 아이디 체크
const checkFileId = () => {
  if (saveParam[0].NOTICE_FILEID === null || saveParam[0].NOTICE_FILEID === undefined) {
    fileUpload.value.setGuid()
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(saveParam[0].NOTICE_FILEID)
  }
  saveParam[0].NOTICE_FILEID = fileUpload.value.guid
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  if (!saveParam[0].NOTICE_TITLE) {
    Message.warn('제목을 입력 해주세요.')
    return false
  } else if (!saveParam[0].NOTICE_NOTE) {
    Message.warn('내용을 입력 해주세요.')
    return false
  } else if (!saveParam[0].CATEGORY1) {
    Message.warn('화면을 선택해 주세요')
    return false
  } else if (!saveParam[0].CATEGORY2) {
    Message.warn('화면을 선택해 주세요')
    return false
  } else if (!saveParam[0].NOTICE_PERIOD) {
    Message.warn('게시기간을 선택해 주세요')
    return false
  }
  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  //DATCA0030이랑 같은 API사용함
  saveParam[0].INSERT_DATE = saveParam[0].INSERT_DATE.replaceAll('-', '')

  //return commonExecuteApi({ queryId : 'DATCA0070_SAVE_01', list: saveParam })
  return commonRequest("/hse/data/DATCA0070_SAVE_01", { queryId: "DATCA0070_SAVE_01", list: saveParam })
}

/* ********** 삭제전 체크 ********** */
const beforeDelete = () => {
  let result = true

  if (!saveParam[0].NOTICE_NO) {
    Message.warn('신규 등록은 삭제가 불가능 합니다.')
    result = false
  }

  return result
}

/* ********** 삭제 ********** */
const deleteData = () => {
  return commonExecuteApi({ queryId: 'DATCA0070_DELETE_01', list: saveParam })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  for (let i in saveParam[0]) {
    saveParam[0][i] = ''
    if (i === 'NOTICE_NOTE') {
      saveParam[0][i] = ckEditor.value.setContent('')
    }
  }

  for (let j in searchParam) {
    searchParam[j] = ''
  }
  /* 팝업 닫을때 파일첨부 그리드 초기화 */
  fileUpload.value.clearGrid()
  emit('after-search')
  isCreate.value === false
  dialog.value = false
}

const scrollToTop = () => {
  document.getElementById('dialogContent').scrollIntoView({ behavior: 'smooth' })
}

defineExpose({
  openPopup,
})

onMounted(() => {
  grdMain.value.getDataProvider().setObjectRows(treeData, 'children','','')
  grdMain.value.getGridView().expandAll()

  grdMain.value.getGridView().setColumnProperty('mnu_nm', 'autoFilter', true)
  grdMain.value.getGridView().setColumnProperty('path', 'autoFilter', true)
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    height="1000"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>메뉴얼 관리 등록/상세</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title id="dialogContent" class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnDelete', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <div class="d-flex">
            <v-sheet class="h-auto mr-2" width="750px">
              <RealGrid
                ref="grdMain"
                class="mt-2"
                style="height: 370px;"
                is-tree
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
            <v-sheet class="searchArea flex-column" width="750px">
              <div class="d-flex">
                <i-input
                  v-model="saveParam[0].NOTICE_TITLE"
                  :label="$t('제목')"
                  label-width="80px"
                  width="700px"
                  required
                  top-label
                />
              </div>
              <div class="d-flex mt-4">
                <i-input
                  v-model="saveParam[0].KOR_NM"
                  top-label
                  :label="$t('작성자')"
                  width="300px"
                  label-width="80px"
                  readonly
                />
                <i-input
                  v-model="saveParam[0].INSERT_DATE"
                  :label="$t('작성일')"
                  width="300px"
                  label-width="80px"
                  readonly
                  top-label
                />
              </div>
              <div class="d-flex mt-4">
                <i-input
                  v-model="saveParam[0].CATEGORY1"
                  :label="$t('경로')"
                  label-width="80px"
                  width="300px"
                  required
                  top-label
                  readonly
                />
                <i-input
                  v-model="saveParam[0].CATEGORY2"
                  :label="$t('화면명')"
                  label-width="80px"
                  width="300px"
                  required
                  top-label
                  readonly
                />
              </div>
              <div class="d-flex">
                <i-select
                  v-model="saveParam[0].NOTICE_PERIOD"
                  :items="dtPeriod"
                  :label="$t('게시기간')"
                  item-value="COD"
                  item-title="TXT" 
                  width="300px"
                  required
                  top-label
                />
              </div>
            </v-sheet>
          </div>
          <v-sheet height="50%" class="mb-2">
            <CKEditor :id="props.id" height="50vh" ref="ckEditor" v-model="saveParam[0].NOTICE_NOTE" class="mt-2" />
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              :max-file-size="300"
              :button-list="fileUploadButton"
              :is-visibled="fileVisible"
              auto-upload
              style="height: 370px"
            />
          </v-sheet>
        </div>
        <VScaleTransition
          style="transform-origin: center;"
          class="scroll-to-top d-print-none"
        >
          <VBtn
            icon
            @click="scrollToTop"
          >
            <VIcon
              size="22"
              icon="mdi-arrow-up"
            />
          </VBtn>
        </VScaleTransition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss">
.scroll-to-top {
  position: fixed !important;
  z-index: 999;
  inset-block-end: 5%;
  inset-inline-end: 25px;
}
</style>
