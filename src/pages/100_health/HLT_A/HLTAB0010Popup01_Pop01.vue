<script setup>
import { reactive, onMounted, getCurrentInstance, inject, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import _ from 'lodash'
const userStore = useUserStore()
const props = defineProps({
  tab01Data: {
    type: Object,
  },
})

const t = useI18n().t //다국어
const dialog = ref(false)
const rowNum = ref(null)

//단기간,간헐적 작업 체크시 하단 호작업 체크박스 비활성화
const disableValue = reactive({
  HO_NO: false,
})

const dataList = reactive({
  data: [],
})

const openPopup = () => {
  Promise.all([
    //일일안전점검 현황 조회
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_04',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
  ]).then(async (res) => {
    //dataList.data = res[0].ORESULT_CUR.filter((x) => x.HO_NO != '0') //조회한 데이터 변수에 넣음
    dataList.data = res[0].ORESULT_CUR
    rowNum.value = Math.ceil(dataList.data.length / 3) //데이터의 개수에 따라서 v-for가 동적으로 작동하도록(반올림해서)
    for (let i = 0; i < dataList.data.length; i++) {
      await commonSearchApi({
        queryId: 'searchFile',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          FILE_ID: dataList.data[i].HO_FILE_ID,
        },
      }).then((res) => {
        dataList.data[i].FILE_DATA = res.ORESULT_CUR[0]
      })
    }
    for (let i = 0; i < dataList.data.length; i++) {
      commonDownloadFilesApi(dataList.data[i].FILE_DATA).then((res) => {
        if (res) {
          const blob = new Blob([res])
          const url = URL.createObjectURL(blob)
          dataList.data[i].FILE_URL = url
        }
      })
    }

    dialog.value = true
  })
}

const closePopup = () => {
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') { 
    closePopup()
  }
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
    width="1200"
    height="950"
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
      <span>근골격계 부담작업</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="t('근골격계 부담작업')"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-2">
        <table>
          <tr v-for="(row, rowIndex) in rowNum" :key="rowIndex">
            <td style="width: 30%" v-for="(item, colIndex) in 3" :key="colIndex">
              <div v-if="rowIndex * 3 + colIndex < dataList.data.length">
                <div class="d-flex justify-space-between">
                  <span>
                    {{ dataList.data[rowIndex * 3 + colIndex].HO_NO.includes('12')
                        ? '' + dataList.data[rowIndex * 3 + colIndex].HRMF_FCTR
                        : dataList.data[rowIndex * 3 + colIndex].HO_NO +
                          ' ' +
                          dataList.data[rowIndex * 3 + colIndex].HRMF_FCTR }}
                  </span>
                  <v-tooltip>
                    <template v-slot:activator="{ props }">
                      <v-icon icon="mdi-eye-check" v-bind="props"></v-icon>
                    </template>
                    <div class="tooltip_div">예시 : {{ dataList.data[rowIndex * 3 + colIndex].WRK_FORM }}</div>
                  </v-tooltip>
                </div>
                <div class="d-flex">
                  <img style="width: 204px; height: 180px" :src="dataList.data[rowIndex * 3 + colIndex].FILE_URL" />
                  <div class="d-flex flex-column">
                    <div>사용부위 : {{ dataList.data[rowIndex * 3 + colIndex].BODY_PART }}</div>
                    <div class="my-4"></div>
                    <div>시간 :{{ dataList.data[rowIndex * 3 + colIndex].EXP_TIME }}</div>
                    <div class="my-4"></div>
                    <div>
                      {{
                        dataList.data[rowIndex * 3 + colIndex].WGT_DESC ? dataList.data[rowIndex * 3 + colIndex].WGT_DESC : ''
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
table {
  border-collapse: collapse;
  width: 100%;
  border: 1px solid black;
}
td {
  padding: 4px;
  text-align: center; /* 가로 가운데 정렬 */
  vertical-align: middle; /* 세로 가운데 정렬 */
  border: 1px solid black;
  font-size: 16px;
  margin-top: 2px;
  margin-bottom: 2px;
}

.tooltip_div {
  background-color: white;
  color: black;
  margin: -3px -7px;
  padding: 8px;
  font-size: 10pt;
  font-weight: bold;
  // border: 1px solid black;
  text-align: center;
}
</style>
