<script setup>
import { reactive, onMounted, getCurrentInstance, inject, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import _ from 'lodash'
const userStore = useUserStore()
const props = defineProps({
  tab01Data: {
    type: Object,
  },
})

let previousValue = '' //수정시 최초객체를 저장하고 있는 변수
const rowNum = ref(null)
const hazardInvestigationFieldTab02_Tab01 = reactive({
  WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID, //작업표준ID
  ES_SEQ: '', //순번
  UNIT_ID_1: '', //단위작업1 ID
  UNIT_SEQ_1: '', //단위작업1 SEQ
  UNIT_ID_2: '', //단위작업2 ID
  UNIT_SEQ_2: '', //단위작업2 SEQ
  UNIT_ID_3: '', //단위작업3 ID
  UNIT_SEQ_3: '', //단위작업3 SEQ
  HO_NO_0: '', //0호 해당없음
  HO_NO_1: '', //1호 반복성
  HO_NO_2: '', //2호 반복성
  HO_NO_3: '', //3호 부적절한 자세
  HO_NO_4: '', //4호 부적절한 자세
  HO_NO_5: '', //5호 부적절한 자세
  HO_NO_6: '', //6호 무리한 힘
  HO_NO_7: '', //7호 무리한 힘
  HO_NO_8: '', //8호 무리한 힘
  HO_NO_9: '', //9호 무리한 힘
  HO_NO_10: '', //10호 무리한 힘
  HO_NO_11: '', //11호 신체충격
})

//단기간,간헐적 작업 체크시 하단 호작업 체크박스 비활성화
const disableValue = reactive({
  HO_NO: false,
})

const dataList = reactive({
  data: [],
})

onMounted(() => {
  Promise.all([
    //일일안전점검 현황 조회
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_04',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_05',
      param: { WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID },
    }),
  ]).then(async (res) => {
    console.log('res', res)
    //dataList.data = res[0].ORESULT_CUR.filter((x) => x.HO_NO != '0') //조회한 데이터 변수에 넣음
    dataList.data = res[0].ORESULT_CUR
    rowNum.value = Math.ceil(dataList.data.length / 3) //데이터의 개수에 따라서 v-for가 동적으로 작동하도록(반올림해서)
    hazardInvestigationFieldTab02_Tab01.ES_SEQ = res[1].ORESULT_CUR[0].ES_SEQ //순번
    hazardInvestigationFieldTab02_Tab01.UNIT_ID_1 = res[1].ORESULT_CUR[0].UNIT_ID //단위작업1 ID
    hazardInvestigationFieldTab02_Tab01.UNIT_SEQ_1 = res[1].ORESULT_CUR[0].UNIT_SEQ //단위작업1 ID
    hazardInvestigationFieldTab02_Tab01.UNIT_ID_2 = res[1].ORESULT_CUR[1].UNIT_ID //단위작업2 ID
    hazardInvestigationFieldTab02_Tab01.UNIT_SEQ_2 = res[1].ORESULT_CUR[1].UNIT_SEQ //단위작업2 ID
    hazardInvestigationFieldTab02_Tab01.UNIT_ID_3 = res[1].ORESULT_CUR[2].UNIT_ID //단위작업3 ID
    hazardInvestigationFieldTab02_Tab01.UNIT_SEQ_3 = res[1].ORESULT_CUR[2].UNIT_SEQ //단위작업3 ID
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

    previousValue = _.cloneDeep(hazardInvestigationFieldTab02_Tab01)
    console.log('hazardInvestigationFieldTab02_Tab01', hazardInvestigationFieldTab02_Tab01)
  })
})

const setTab02_Tab01Data = (data) => {
  if (data.HO_NO && data.HO_NO.includes(',')) {
    let hoData = data.HO_NO.split(',')
    hoData.forEach((num) => {
      let key = `HO_NO_${num}`

      hazardInvestigationFieldTab02_Tab01[key] = Number(num)
    })
  }
  //호번호를 하나만체크했을경우
  else if (data.HO_NO !== ' ' && !data.HO_NO?.includes(',') && !data.HO_NO !== null) {
    let key = `HO_NO_${data.HO_NO}`
    hazardInvestigationFieldTab02_Tab01[key] = Number(data.HO_NO)
  }
  previousValue = _.cloneDeep(hazardInvestigationFieldTab02_Tab01)
}

watch(
  () => [
    hazardInvestigationFieldTab02_Tab01.HO_NO_1,
    hazardInvestigationFieldTab02_Tab01.HO_NO_2,
    hazardInvestigationFieldTab02_Tab01.HO_NO_3,
    hazardInvestigationFieldTab02_Tab01.HO_NO_4,
    hazardInvestigationFieldTab02_Tab01.HO_NO_5,
    hazardInvestigationFieldTab02_Tab01.HO_NO_6,
    hazardInvestigationFieldTab02_Tab01.HO_NO_7,
    hazardInvestigationFieldTab02_Tab01.HO_NO_8,
    hazardInvestigationFieldTab02_Tab01.HO_NO_9,
    hazardInvestigationFieldTab02_Tab01.HO_NO_10,
  ],
  (newValue) => {
    const hasValue = newValue.some((val) => val !== '' && val !== null && val !== undefined)
    //부담작업 체크하면 부담작업없음 체크 해제
    if (hasValue) {
      hazardInvestigationFieldTab02_Tab01.HO_NO_0 = ''
    }
  },
  { deep: true }
)

//부담작업 없음 체크하면 다른곳 다 체크해제
watch(
  () => hazardInvestigationFieldTab02_Tab01.HO_NO_0,
  (newValue) => {
    if (newValue === 0) {
      hazardInvestigationFieldTab02_Tab01.HO_NO_1 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_2 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_3 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_4 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_5 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_6 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_7 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_8 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_9 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_10 = ''
      hazardInvestigationFieldTab02_Tab01.HO_NO_11 = ''
    }
  }
)

//저장할때 변경사항 유무 확인하는 함수
const getModifyFlag = () => {
  const isChanged = _.isEqual(hazardInvestigationFieldTab02_Tab01, previousValue)
  if (!isChanged) {
  }
  return isChanged
}

//저장하고나서 저장한 데이터를 원본 데이터에 덮어씀(다음화면에서 이전단계 눌렀을때 변경사항 저장하고 있기위해서)
const setModifyFlag = () => {
  Object.assign(previousValue, hazardInvestigationFieldTab02_Tab01)
}

const getTab02_Tab01Data = () => {
  return hazardInvestigationFieldTab02_Tab01
}

defineExpose({
  getTab02_Tab01Data,
  setTab02_Tab01Data,
  getModifyFlag,
  setModifyFlag,
})
</script>

<template>
  <table>
    <tr v-for="(row, rowIndex) in rowNum" :key="rowIndex">
      <td style="width: 30%" v-for="(item, colIndex) in 3" :key="colIndex">
        <div v-if="rowIndex * 3 + colIndex < dataList.data.length">
          <div class="d-flex justify-space-between">
            <v-checkbox
              :label="
                //0호는 부담작업없음인데 0호라는 텍스트 빼고 부담작업없음만 표시하도록
                dataList.data[rowIndex * 3 + colIndex].HO_NO === '0호'
                  ? '' + dataList.data[rowIndex * 3 + colIndex].HRMF_FCTR
                  : dataList.data[rowIndex * 3 + colIndex].HO_NO +
                    ' ' +
                    dataList.data[rowIndex * 3 + colIndex].HRMF_FCTR
              "
              :true-value="rowIndex * 3 + colIndex"
              false-value=""
              v-model="hazardInvestigationFieldTab02_Tab01[`HO_NO_${rowIndex * 3 + colIndex}`]"
            ></v-checkbox>
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
