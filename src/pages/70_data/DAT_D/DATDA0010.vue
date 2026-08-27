<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { chkEmpty } from '@/utils/common'
import _ from 'lodash'

import DATDA0010Popup01 from '@/pages/70_data/DAT_D/DATDA0010Popup01.vue'
import DATDA0010Popup02 from '@/pages/70_data/DAT_D/DATDA0010Popup02.vue'
import DATDA0010Popup03 from '@/pages/70_data/DAT_D/DATDA0010Popup03.vue'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const isAdmin = ref(userStore.authGrpCd.includes('DATDA001'))

const noticeData = ref([])
const page = ref(1)
const totalPage = ref(1)
const lineCnt = ref('15')

const gridTitle = ref(null)
const grdMain = ref(null)

const popMngAdmin = ref(null)
const popRegist = ref(null)
const popDetail = ref(null)

defineOptions({
  name: '70_data-DAT_D-DATDA0010',
})

const codeList = reactive({
  STATUS: [],
  CONTENT_HD: [],
  GBN: [
    { COD: 'A', TXT: '제목', },
    { COD: 'B', TXT: '내용', },
    { COD: 'C', TXT: '작성자', },
  ],
  LINE_CNT: [
    { COD: '5', TXT: '5줄 보기', },
    { COD: '10', TXT: '10줄 보기', },
    { COD: '15', TXT: '15줄 보기', },
    { COD: '20', TXT: '20줄 보기', },
    { COD: '30', TXT: '30줄 보기', },
  ],
  SHOW_NOTI: [
    { COD: '', TXT: '전체', },
    { COD: 'Y', TXT: '게시', },
    { COD: 'N', TXT: '미게시', },
  ]
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  STATUS: '',
  CONTENT_HD: '',
  GBN: 'A',
  SEARCH_TXT: '',
  SHOW_NOTI: 'Y',
})

const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: false },
    // rowIndicator: { visible: false, },
  },
  fields: [
    { fieldName: 'EXPAND', dataType: 'text', header: { text: t(' '), styleName: 'cell-expand', }, width: '12', resizable: false, styleName: 'cell-expand', },
    { fieldName: 'TITLE', dataType: 'text', header: { text: t('제목'), }, width: '700', styleName: 'left-column hover-title',
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          let result = ''
          const currRow = grdMain.value.getDataProvider().getJsonRow(cell.index.dataRow)
          const currLvl = grdMain.value.getDataProvider().getLevel(cell.index.dataRow)

          result += '<div class="d-flex align-center" style="padding-left: 6px;">'

          if(currRow.NOTI_YN === 'Y') {
            result +=   `<div style="padding: 3px 6px; color: #ffffff; margin-right: 6px; background-color: ${currRow.SHOW_NOTI === 'Y' ? '#ff5252' : '#aaaaaa'}; border-radius: 4px;">`
            result +=      '공지'
            result +=   '</div>'
          }

          if(currLvl > 1) {
            result += '<div class="mdi mdi-arrow-right-bottom" style="margin: 0 6px;"></div>'
          }

          result +=   '<div class="text-title">'
          result +=      cell.value
          result +=   '</div>'

          if(currRow.FILE_CNT > 0) {
            result += '<div class="mdi mdi-content-save-all" style="margin-left: 4px; font-size: 18px; color: #555555;"></div>'
          }

          result += '</div>'

          return result
        },
      }
    },
    { fieldName: 'SEQ2', dataType: 'text', header: { text: t('글번호'), }, width: '65', },
    { fieldName: 'NICK_NAME', dataType: 'text', header: { text: t('작성자'), }, },
    { fieldName: 'INSERT_DATE', dataType: 'text', header: { text: t('등록일'), }, },
    { fieldName: 'SEARCH_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('조회수'), }, },
    { fieldName: 'REPLY_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('댓글'), }, },
    { fieldName: 'AGREE_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('공감'), },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          let result = ''
          
          if(cell.value >= 30) {
            result += `<div class="d-flex justify-center align-center">`
            result +=   `<div>${cell.value}</div>`
            result +=   `<div style="margin-left: 4px; padding: 3px 6px; color: #ffffff; margin-right: 6px; background-color: #ff5252; border-radius: 4px;">Hot</div>`
            result += `</div>`
          } else {
            result += `<div>${cell.value}</div>`
          }

          return result
        },
      }
    },

    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ'), }, visible: false, },
    { fieldName: 'TREE_ID', dataType: 'text', header: { text: t('TREE_ID'), }, visible: false, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'CONTENT', dataType: 'text', header: { text: t('CONTENT'), }, visible: false, },
    { fieldName: 'NOTI_YN', dataType: 'text', header: { text: t('NOTI_YN'), }, visible: false, },
    { fieldName: 'GBN', dataType: 'text', header: { text: t('GBN'), }, visible: false, },
    { fieldName: 'SHOW_NOTI', dataType: 'text', header: { text: t('SHOW_NOTI'), }, visible: false, },
    { fieldName: 'FILE_CNT', dataType: 'number', header: { text: t('FILE_CNT'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const getCommonCode = () => {
  Promise.all([
    getCodeList('HHIZ090HA'),
  ]).then(res => {
    codeList.STATUS = res[0].ORESULT_CUR
    codeList.STATUS.unshift({ COD: '', TXT: '전체', })
  })
}

const getContentHd = () => {
  commonSearchApi({ queryId: 'DATDA0010_SEARCH_01', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_YN: 'Y', } }).then(res => {
    codeList.CONTENT_HD = res.ORESULT_CUR
    codeList.CONTENT_HD.unshift({ SEQ: '', CONTENT_HD: '전체', })
  })
}

const getImg = () => {
  return new URL(`/src/assets/images/icons/DATCA0060ICON.png`, import.meta.url).href
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnSearch') {
    searchMain()
  } else if(btnId === 'btnRegist') {
    popRegist.value.openPopup()
  } else if(btnId === 'btnRegist1') {
    popRegist.value.openPopup2()
  }
}

const searchMain = (showMsg = true) => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

const searchData = () => {
  grdMain.value.getDataProvider().setRows([], 'TREE_ID', false, null)

  return commonRequest('/hse/DATDA0010/searchContent', { queryId: 'DATDA0010_SEARCH_03', param: searchParams, })
}

const afterSearch = res => {
  // const result = []

  // for(let i = 0; i < res.ORESULT_CUR.length; i++) {
  //   if(searchParams.GBN === 'B') {
  //     if(chkEmpty(searchParams.SEARCH_TXT) ||
  //       (!chkEmpty(searchParams.SEARCH_TXT) && res.ORESULT_CUR[i].CONTENT.indexOf(searchParams.SEARCH_TXT) > -1)) {
  //       result.push(res.ORESULT_CUR[i])
  //     }
  //   } else {
  //     result.push(res.ORESULT_CUR[i])
  //   }
  // }

  noticeData.value = res.ORESULT_CUR

  changeLineCnt()
}

const mngAdmin = () => {
  popMngAdmin.value.openPopup()
}

const changeLineCnt = () => {
  const noticeTemp = _.filter(noticeData.value, { GBN: 'A' })
  const answer = _.filter(noticeData.value, { GBN: 'B' })

  totalPage.value = Math.ceil(noticeData.value.length / (lineCnt.value * 1))

  // if(page.value > totalPage.value) {
  //   page.value = 1
  // }

  // console.log('notice', notice)
  // console.log('page.value', page.value)
  // console.log('totalPage.value', totalPage.value)
  // console.log('lineCnt.value', lineCnt.value)

  const notice = noticeTemp.slice((page.value - 1) * lineCnt.value, page.value * lineCnt.value)
  const temp = []

  for(let i = 0; i < notice.length; i++) {
    const noticeRow = notice[i]
    temp.push(noticeRow)

    for(let j = 0; j < answer.length; j++) {
      const answerRow = answer[j]

      if(noticeRow.CMPNY_DIV === answerRow.CMPNY_DIV && noticeRow.SEQ === answerRow.SEQ) {
        temp.push(answerRow)
      }
    }
  }

  grdMain.value.getDataProvider().setRows(temp, 'TREE_ID', false, null)
  grdMain.value.getGridView().expandAll()
}

const onCellClicked = (grid, data) => {
  // console.log('onCellClicked data', data)
  if(data.cellType === 'data') {
    if(data.fieldName === 'TITLE') {
      const rowData = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
      // console.log('rowData', rowData)
      popDetail.value.openPopup(rowData)
    }
  }
}

onMounted(() => {
  getCommonCode()
  getContentHd()

  nextTick(() => {
    gridTitle.value.setBtnProperty('btnRegist1', 'text', '공지 등록')
    gridTitle.value.setBtnProperty('btnRegist1', 'visible', isAdmin.value)

    grdMain.value.getGridView().displayOptions.syncGridHeight = 'over'

    searchMain(false)
  })
})
</script>

<template>
  <v-card class="pa-3 fill-height notice-main" tabindex="-1">
    <v-card-title class="pa-0">
      <IMenuTitle :title="$t(useLogsStore().menuId)" />
    </v-card-title>
    <v-card-text class="pa-0 overflow-y-auto" style="height: calc(100% - 42px);">
      <div class="div__ground-rule">
        <div class="abcdeee"></div>
        <div class="div__title">
          안전 소통 게시판 그라운드룰(Ground Rule)
        </div>
        <div class="d-flex align-center">
          <div class="img-speaker">
            <v-img
              width="150"
              height="150"
              :src="getImg()"
            />
          </div>
          <div>
            <div>
              <div class="d-flex align-center div__subtitle">
                <v-icon color="primary" class="icon-check">mdi-checkbox-marked</v-icon>
                익명 보장은 확실하게, 기명으로도 언제든 참여 가능합니다.
              </div>
              <div class="div__content">
                익명성을 보장하기 위해 작성자 정보는 별도로 저장되지 않습니다. 게시글은 익명 아이디와 등록 시 설정한 비밀번호를 통해 수정·삭제할 수 있습니다.
                <br/>이름을 밝히고 싶은 분은 기명으로 자유롭게 남기셔도 됩니다.
              </div>
            </div>
            <div>
              <div class="d-flex align-center div__subtitle">
                <v-icon color="primary" class="icon-check">mdi-checkbox-marked</v-icon>
                비방·욕설·허위사실은 금지입니다.
              </div>
              <div class="div__content">
                서로를 존중하고, 안전한 소통 문화를 함께 만들어 주세요.
              </div>
            </div>
            <div>
              <div class="d-flex align-center div__subtitle">
                <v-icon color="primary" class="icon-check">mdi-checkbox-marked</v-icon>
                머리글을 정확히 선택해주세요.
              </div>
              <div class="div__content">
                선택된 머리글에 따라 해당 담당자에게 자동 알림이 전달됩니다. 빠르고 정확한 답변을 위해 내용을 구체적으로 작성해 주세요.
              </div>
            </div>
            <div>
              <div class="d-flex align-center div__subtitle">
                <v-icon color="primary" class="icon-check">mdi-checkbox-marked</v-icon>
                모두가 공감할 수 있는 이야기를 나눕니다.
              </div>
              <div class="div__content">
                개인적 하소연보다는, 현장의 개선·공감·소통에 도움이 되는 내용을 중심으로 자유롭게 의견을 남겨주세요.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="d-flex">
          <div class="flex-1-1">
            <IGridTitle
              ref="gridTitle"
              :button-list="['btnSearch', 'btnRegist', 'btnRegist1']"
              @click-button="onButtonsClick"
              :use-permission="false"
            />
          </div>
          <div v-show="isAdmin">
            <v-btn @click="mngAdmin">
              관리자 지정
            </v-btn>
          </div>
        </div>
        <v-sheet class="searchArea d-flex justify-space-between">
          <div class="d-flex">
            <i-select
              v-model="searchParams.STATUS"
              :items="codeList.STATUS"
              item-value="COD"
              item-title="TXT"
              :label="$t('상태')"
              width="200px"
            />
            <i-select
              v-model="searchParams.CONTENT_HD"
              :items="codeList.CONTENT_HD"
              item-value="SEQ"
              item-title="CONTENT_HD"
              :label="$t('말머리')"
              width="225px"
            />
            <i-select
              v-model="searchParams.GBN"
              :items="codeList.GBN"
              :label="$t('검색')"
              item-value="COD"
              item-title="TXT"
              width="175px"
              margin="5px"
            />
            <i-input
              v-model="searchParams.SEARCH_TXT"
              label=""
              width="250px"
            />
            <i-select
              v-show="isAdmin"
              v-model="searchParams.SHOW_NOTI"
              :items="codeList.SHOW_NOTI"
              :label="$t('공지게시')"
              item-value="COD"
              item-title="TXT"
              width="175px"
            />
          </div>
          <div>
            <i-select
              v-model="lineCnt"
              :items="codeList.LINE_CNT"
              label=""
              item-value="COD"
              item-title="TXT"
              width="125px"
              margin="0"
              @update:model-value="changeLineCnt"
            />
          </div>
        </v-sheet>
        <RealGrid
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          @onCellClicked="onCellClicked"
          style="height: 315px;"
          is-tree
        />
        <div>
          <v-pagination
            v-model="page"
            :length="totalPage"
            :total-visible="10"
            @update:model-value="changeLineCnt"
          />
        </div>
      </div>
    </v-card-text>

    <DATDA0010Popup01 ref="popMngAdmin" @saved="getContentHd" />
    <DATDA0010Popup02 ref="popRegist" @saved="searchMain(false)" ck-editor-id="ck-editor__main" />
    <DATDA0010Popup03 ref="popDetail" @saved="searchMain(false)" />
  </v-card>
</template>

<style lang="scss" scoped>
.notice-main {
  color: #222222;

  .div__ground-rule {
    margin-bottom: 12px;

    .img-speaker {
      padding: 0 12px;
    }

    background-color: #F4F5F9;
    border-radius: 12px;
    padding: 12px 16px;

    .div__title {
      font-weight: bold;
      font-size: 18px;
      padding-bottom: 6px;
    }

    .div__subtitle {
      margin-top: 6px;
      font-weight: bold;
      font-size: 16px;

      .icon-check {
        margin-right: 4px;
      }
    }

    .div__content {
      padding-left: 28px;
      font-size: 14px;
    }
  }

  ::v-deep(.v-pagination__prev), ::v-deep(.v-pagination__next) {
    button {
      padding: 0 !important;
    }
  }
}

::v-deep(.cell-expand) {
  border-right: none !important;
}

::v-deep(.hover-title) {
  cursor: pointer;
}

::v-deep(.hover-title):hover {
  .text-title {
    font-weight: bold !important;
  }
}
</style>