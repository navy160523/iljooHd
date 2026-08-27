<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonRequest, commonExecuteApi } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import _ from 'lodash'
import Message from '@hiway/utils/notify'
import { chkEmpty } from '@/utils/common'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const dialog = ref(false)
const popupTitle = ref(null)
const gridTitle = ref(null)
const isSaved = ref(false)
const CRUD = ref(null)
const emit = defineEmits(['close'])
const updateYn = ref(true)
const CHECK_LIST = ref({ CHECK_DIV: [], CHECK_LIST: [], CHECK_ITEM: [] })

const initParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '',
  BSNS_CD: userStore.bsnsCd,
  BSNS_NM: userStore.bsnsNm,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  ASGN_CD: userStore.asgnCd,
  ASGN_CD_ORG: '',
  ASGN_NM: userStore.asgnNm,
  EMP_NO: userStore.empNo,
  EMP_NM: userStore.empNm,
  SEQ: '',
  CHECK_DATE: '',
  WORK_PLACE: '',
  WORK_DESC: '',
  APP_STATUS: '',
  APP_STATUS_NM: '',
  APP_EMP_NO: '',
  APP_EMP_NM: '',
  USER_DIV: '',
})

const codeList = reactive({
  ASGN_CD: [],
})

const popupParams = reactive({})

const openPopup = param => {
  setPopup(param)
  dialog.value = true
}

const initPopup = async () => {
  isSaved.value = false
  updateYn.value = true
  gridTitle.value.disableBtn('btnUpdate', true)
  // gridTitle.value.disableBtn('btnDelete', true)
  CHECK_LIST.value = { CHECK_DIV: [], CHECK_LIST: [], CHECK_ITEM: [] }

  initParams.CHECK_DATE = dayjs().format('YYYY-MM-DD')

  if(userStore.userDiv === 'A') {
    await commonSearchApi({ queryId: 'HLTNA0030_SEARCH_ASGN', param: initParams }).then(res => {
      if(res.ORESULT_CUR.length > 0) {
        initParams.ASGN_CD = res.ORESULT_CUR[0].ASGN_CD
        initParams.ASGN_NM = res.ORESULT_CUR[0].ASGN_NM
      }
    })
  }

  Object.keys(initParams).forEach(key => {
    popupParams[key] = initParams[key]
  })
}

const searchAsgnList = () => {
  commonSearchApi({ queryId: 'HLTNA0030_SEARCH_ASGN2', param: popupParams }).then(res => {
    codeList.ASGN_CD = res.ORESULT_CUR
  })
}

const setPopup = async data => {
  CRUD.value = data.CRUD
  await initPopup()

  if(CRUD.value === 'I') {
    popupTitle.value = '온열질환 위험성평가 체크리스트 등록'
    gridTitle.value.disableBtn('btnUpdate', false)
    searchCheckList()
  } else {
    popupTitle.value = '온열질환 위험성평가 체크리스트 수정'

    popupParams.CMPNY_DIV = data.CMPNY_DIV
    popupParams.YEAR = data.YEAR
    popupParams.BSNS_CD = data.BSNS_CD
    popupParams.DEPT_CD = data.DEPT_CD
    popupParams.ASGN_CD = data.ASGN_CD
    popupParams.SEQ = data.SEQ

    searchMain()
    searchCheckList()
  }

  searchAsgnList()
}

const searchCheckList = () => {
  commonSearchApi({ queryId: 'HLTNA0030_SEARCH_02', param: popupParams }).then(res => {
    const result = _.cloneDeep(res.ORESULT_CUR)

    CHECK_LIST.value.CHECK_DIV = _.uniqBy(
      result.map(row => {
        return {
          CHECK_CD1: row.CHECK_CD1,
          CHECK_CDNM1: row.CHECK_CDNM1,
          CHECK_CD1_DESC1: row.CHECK_CD1_DESC1,
          CHECK_CD1_DESC2: row.CHECK_CD1_DESC2
        }
      }),
      'CHECK_CD1'
    )

    CHECK_LIST.value.CHECK_LIST = _.uniqWith(
      result.map(row => {
        return {
          CHECK_CD1: row.CHECK_CD1,
          CHECK_CDNM1: row.CHECK_CDNM1,
          CHECK_CD2: row.CHECK_CD2,
          CHECK_CDNM2: row.CHECK_CDNM2,
          CHECK_CD3: row.CHECK_CD3,
          CHECK_CDNM3: row.CHECK_CDNM3,
          CHECK_CD3_DESC1: row.CHECK_CD3_DESC1,
          CHECK_CD3_DESC2: row.CHECK_CD3_DESC2,
          CHECK_CD3_DESC6: row.CHECK_CD3_DESC6,
          CHECK_VALUE: row.CHECK_VALUE,
          REMARKS: row.REMARKS,
        }
      }),
      (a, b) => {
        return a.CHECK_CD1 === b.CHECK_CD1 && a.CHECK_CD2 === b.CHECK_CD2 && a.CHECK_CD3 === b.CHECK_CD3
      }
    )

    for(let i = 0; i < CHECK_LIST.value.CHECK_LIST.length; i++) {
      if(i === 0 || (i > 0 &&  CHECK_LIST.value.CHECK_LIST[i].CHECK_CD2 !== CHECK_LIST.value.CHECK_LIST[i - 1].CHECK_CD2)) {
        CHECK_LIST.value.CHECK_LIST[i].ROWSPAN = _.filter(CHECK_LIST.value.CHECK_LIST, row => row.CHECK_CD1 === CHECK_LIST.value.CHECK_LIST[i].CHECK_CD1 && row.CHECK_CD2 === CHECK_LIST.value.CHECK_LIST[i].CHECK_CD2).length
      } else {
        CHECK_LIST.value.CHECK_LIST[i].ROWSPAN = null
      }
    }

    // console.log('CHECK_LIST.value.CHECK_LIST', CHECK_LIST.value.CHECK_LIST)

    CHECK_LIST.value.CHECK_ITEM = result.map(row => {
      return {
        CHECK_CD1: row.CHECK_CD1,
        CHECK_CD2: row.CHECK_CD2,
        CHECK_CD3: row.CHECK_CD3,
        CHECK_CD4: row.CHECK_CD4,
        CHECK_CDNM4: row.CHECK_CDNM4,
      }
    })
  })
}

const searchMain = () => {
  commonSearchApi({ queryId: 'HLTNA0030_SEARCH_01', param: popupParams }).then(res => {
    const result = res.ORESULT_CUR

    // console.log('result', result)

    if(result.length > 0) {
      Object.keys(popupParams).forEach(key => {
        popupParams[key] = result[0][key]
      })

      if(popupParams.EMP_NO !== userStore.empNo || (popupParams.APP_STATUS !== 'A' && popupParams.APP_STATUS !== 'C')) {
        updateYn.value = false
      }
    }

    // console.log('popupParams', popupParams)

    gridTitle.value.disableBtn('btnUpdate', !updateYn.value)
    // gridTitle.value.disableBtn('btnDelete', !updateYn.value)
  })
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnUpdate') {
    saveData()
  } else if(btnId === 'btnDelete') {
    // deleteData()
  } else if(btnId === 'btnClose') {
    emit('close', isSaved.value)
    dialog.value = false
  } else if(btn.id === 'btnReqApply') {

  } 
}

const saveData = () => {
  new saveFlowHelper(vm, t)
    .setBefore(() => {
      // console.log('popupParams.CHECK_DATE', popupParams.CHECK_DATE)

      if(chkEmpty(popupParams.CHECK_DATE)) {
        Message.warn('평가일자를 입력해 주세요.')
        return false
      } else if(chkEmpty(popupParams.ASGN_CD)) {
        Message.warn('평가 조직을 선택해 주세요.')
        return false
      } else if(chkEmpty(popupParams.WORK_PLACE)) {
        Message.warn('주 작업장소를 입력해 주세요.')
        return false
      } else if(chkEmpty(popupParams.WORK_DESC)) {
        Message.warn('주 작업내용을 입력해 주세요.')
        return false
      }

      // console.log('CHECK_LIST.value.CHECK_LIST', CHECK_LIST.value.CHECK_LIST)

      for(let i = 0; i < CHECK_LIST.value.CHECK_LIST.length; i++) {
        const chkRow = CHECK_LIST.value.CHECK_LIST[i]
        const chkDiv = _.find(CHECK_LIST.value.CHECK_DIV, div => div.CHECK_CD1 === chkRow.CHECK_CD1)
        
        // console.log('chkDiv', chkDiv)
        if(chkEmpty(chkRow.CHECK_VALUE)) {
          Message.warn(`${chkDiv.CHECK_CD1_DESC1}를 선택해 주세요.(${chkRow.CHECK_CDNM2} - ${chkRow.CHECK_CDNM3})`)
          return false
        } else if(chkEmpty(chkRow.REMARKS)) {
          Message.warn(`${chkDiv.CHECK_CD1_DESC2}을 입력해주세요.(${chkRow.CHECK_CDNM2} - ${chkRow.CHECK_CDNM3})`)
          return false
        }/* else if(chkRow.CHECK_CD1 === 'A' && chkEmpty(chkRow.REMARKS)) {
          Message.warn(`${chkDiv.CHECK_CD1_DESC2}을 입력해주세요.(${chkRow.CHECK_CDNM2} - ${chkRow.CHECK_CDNM3})`)
          return false
        } else if(chkRow.CHECK_CD1 === 'B' && chkRow.CHECK_VALUE === 'N' && chkEmpty(chkRow.REMARKS)) {
          Message.warn(`개선 필요시 ${chkDiv.CHECK_CD1_DESC2}을 입력해주세요.(${chkRow.CHECK_CDNM2} - ${chkRow.CHECK_CDNM3})`)
          return false
        }*/
      }

      return true
    })
    .setQuery(() => {
      const saveMain = _.cloneDeep(popupParams)
      const saveList = _.cloneDeep(CHECK_LIST.value.CHECK_LIST)
      
      saveList.forEach(item => {
        item.CMPNY_DIV = popupParams.CMPNY_DIV
        item.YEAR = popupParams.YEAR
        item.BSNS_CD = popupParams.BSNS_CD
        item.DEPT_CD = popupParams.DEPT_CD
        item.ASGN_CD = popupParams.ASGN_CD
        item.ASGN_CD_ORG = popupParams.ASGN_CD_ORG
        item.SEQ = popupParams.SEQ
      })

      const data = {
        CRUD: CRUD.value,
        CHECK_MAIN: saveMain,
        CHECK_LIST: saveList,
      }

      return commonRequest('/hse/health/HLTLA0030/saveData', {
        param: data,
      })
    })
    .setAfter(async res => {
      if(CRUD.value === 'I') {
        CRUD.value = 'U'
        popupTitle.value = '온열질환 위험성평가 체크리스트 수정'
      }

      popupParams.YEAR = res.param.CHECK_MAIN.OUT_RES_YEAR
      popupParams.SEQ = res.param.CHECK_MAIN.OUT_RES_SEQ

      searchMain()
      searchCheckList()

      isSaved.value = true
    })
    .run()
}

const deleteData = () => {
  new deleteFlowHelper(vm, t)
    .setQuery(() => {
      return commonExecuteApi({ queryId: 'HLTNA0030_DELETE_01', list: [popupParams], })
    })
    .setAfter(() => {
      isSaved.value = true
      onButtonsClick({ id: 'btnClose' })
    })
    .run()
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="auto"
    height="100%"
    scrollable
  >
    <div class="title-bar">
      {{ popupTitle }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0 py-0">
        <IGridTitle
          ref="gridTitle"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
        <!-- <IGridTitle
          ref="gridTitle"
          :button-list="['btnReqApply', 'btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        /> -->
      </v-card-title>
      <div class="px-2" style="width: 100%;">
        <table class="table-main">
          <colgroup>
            <col style="width: 20%;" />
            <col style="width: 30%;" />
            <col style="width: 20%;" />
            <col style="width: 30%;" />
          </colgroup>
          <tbody>
            <tr>
              <th>부서명</th>
              <td class="td-text">{{ popupParams.DEPT_NM }}</td>
              <th>평가일자</th>
              <td>
                <i-input
                  width="140px"
                  type="date"
                  margin="0"
                  v-model="popupParams.CHECK_DATE"
                  :nullMsg="false"
                  :disabled="!updateYn"
                />
              </td>
            </tr>
            <tr>
              <th>평가 조직</th>
              <td v-if="(CRUD === 'I' && userStore.userDiv === 'A') || popupParams.USER_DIV === 'A'" class="td-text">
                <i-select
                  v-model="popupParams.ASGN_CD"
                  :items="codeList.ASGN_CD"
                  item-value="ASGN_CD"
                  item-title="ASGN_NM"
                  width="100%"
                  margin="0"
                  :disabled="!updateYn"
                />
              </td>
              <td v-else class="td-text">{{ popupParams.ASGN_NM }}</td>
              <th>작성자</th>
              <td class="td-text">{{ popupParams.EMP_NM }}</td>
            </tr>
            <tr>
              <th>주 작업장소</th>
              <td>
                <v-text-field v-model="popupParams.WORK_PLACE" :disabled="!updateYn" />
              </td>
              <th>주 작업내용</th>
              <td>
                <v-text-field v-model="popupParams.WORK_DESC" :disabled="!updateYn" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <v-card-text class="pa-2 pa-0 mt-5 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <template v-for="(div, divIdx) in CHECK_LIST.CHECK_DIV" :key="`div__${divIdx}`">
            <table
              class="table-check"
              :class="[divIdx > 0 ? 'mt-5' : '']"
            >
              <colgroup>
                <col style="width: 85px;" />
                <col style="width: 500px;" />
                <col style="width: 120px;" />
                <col style="width: 350px;" />
              </colgroup>
              <thead>
                <tr>
                  <th colspan="4">{{ `${divIdx + 1}. ${div.CHECK_CDNM1}` }}</th>
                </tr>
                <tr>
                  <th>구분</th>
                  <th>내용</th>
                  <th>{{ div.CHECK_CD1_DESC1 }}</th>
                  <th>{{ div.CHECK_CD1_DESC2 }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="checkList in _.filter(CHECK_LIST.CHECK_LIST, row => { return row.CHECK_CD1 === div.CHECK_CD1 })"
                  :key="`checkList__${checkList.CHECK_CD1}${checkList.CHECK_CD2}`"
                >
                  <td class="cdnm2" v-if="checkList.ROWSPAN != null" :rowspan="checkList.ROWSPAN">{{ checkList.CHECK_CDNM2 }}</td>
                  <td>
                    <div>{{ checkList.CHECK_CDNM3 }}</div>
                    <div v-if="checkList.CHECK_CD3_DESC1 != null">{{ checkList.CHECK_CD3_DESC1 }}</div>
                    <div v-if="checkList.CHECK_CD3_DESC2 != null">{{ checkList.CHECK_CD3_DESC2 }}</div>
                  </td>
                  <td>
                    <v-radio-group v-model="checkList.CHECK_VALUE" :disabled="!updateYn">
                      <v-radio
                        v-for="checkItem in _.filter(CHECK_LIST.CHECK_ITEM, item => {
                          return item.CHECK_CD1 === checkList.CHECK_CD1
                              && item.CHECK_CD2 === checkList.CHECK_CD2
                              && item.CHECK_CD3 === checkList.CHECK_CD3
                        })"
                        :key="`checkItem__${checkItem.CHECK_CD1}${checkItem.CHECK_CD2}${checkItem.CHECK_CD3}${checkItem.CHECK_CD4}`"
                        :label="checkItem.CHECK_CDNM4"
                        :value="checkItem.CHECK_CD4"
                      />
                    </v-radio-group>
                  </td>
                  <td>
                    <v-textarea v-model="checkList.REMARKS" rows="3" :disabled="!updateYn" :placeholder="checkList.CHECK_CD3_DESC6" />
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.table-main {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #cccccc;

  th, td {
    border: 1px solid #cccccc;
    color: #000000de;
  }

  th {
    background-color: #deeaf6;
    padding: 4px 8px;
  }

  td {
    padding: 4px;
  }

  .td-text {
    padding: 4px 8px;
  }
}

.table-check {
  border-collapse: collapse;
  border: 1px solid #cccccc;

  thead {
    tr:first-child {
      th {
        text-align: left;
        background-color: #deeaf6;
      }
    }

    tr:nth-child(2) {
      th {
        background-color: #dddddd;
      }
    }

    th {
      border: 1px solid #cccccc;
      padding: 4px 8px;
    }
  }

  tbody {
    tr {
      .cdnm2 {
        text-align: center;
      }
    }

    td {
      border: 1px solid #cccccc;
      padding: 4px 8px;
    }
  }
}
</style>