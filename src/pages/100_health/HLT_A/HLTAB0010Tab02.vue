<!-- 
  화면명 : 정기 수시 평가
  화면개요 : 보건 위험성평가 정기/수시 평가
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, chatbotTranslateLn, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import HLTAB0010Tab02Popup01 from '@/pages/100_health/HLT_A/HLTAB0010Tab02_Popup01.vue'
import HLTAB0010Tab02Popup03 from '@/pages/100_health/HLT_A/HLTAB0010Tab02_Popup03.vue'
import HLTAB0010Tab02Popup04 from '@/pages/100_health/HLT_A/HLTAB0010Tab02_Popup04.vue'

const emit = defineEmits(['propOnButtonsClick'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const data = ref([])
const isAdmin = ref(false)
const popup01 = ref(null)
const popup03 = ref(null)
const popup04 = ref(null)
const classificaitonColor = ref({
  5: '#EE4A32',
  4: '#F68322',
  3: '#FBAC00',
  2: '#78C292',
  1: '#4472C4'
})

const props = defineProps({ 
  searchParams: Object,
}) // props 객체를 직접 사용

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }

  // getData()
})  

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   Message.warn(t('관리자만 사용가능합니다.'))
  //   return
  // }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnNewRegular') {
    emit('propOnButtonsClick', btn)
  }
}
const getData = () => {

  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0010_SEARCH_01', param: props.searchParams })
}

// 조회 후
const afterSearch = (res) => {
  data.value = res.ORESULT_CUR
}

const saveData = () => {
  let saveParams = []
  for(let d of data.value.filter(item => item.SEQ == '1')) {
    d.PLAN_DECREASE = d.GUIDE
    d.SEQ = props.searchParams.SEQ
    saveParams.push(d)
  }

  commonExecuteApi({ queryId : 'HLTAB0010_SAVE_07', list: saveParams }).then(res => {
    getData()
    Message.success(t('성공적으로 저장되었습니다'))
  })
}

const btnAdjust = (dt) => {
  let prcParam = {}
  data.value.forEach(item => {
    if (!prcParam[item.GBN_NO]) {
      prcParam[item.GBN_NO] = []
    }
    if(item.SEQ == '1') {
      prcParam[item.GBN_NO].push({COD:item.PROCESS_CD, TXT:item.PROCESS_NM})
    }
  })

  if (dt.GBN_NO == 'C') {
    popup03.value.openPopup({...dt, COMBO_LIST: prcParam})
  } else {
    if(isEmpty(props.searchParams.ASGN_CD)) {
      popup01.value.openPopup({...dt, COMBO_LIST: prcParam, REV_NO: props.searchParams.SEQ })
    } else {
      popup04.value.openPopup({...dt, REV_NO: props.searchParams.SEQ} )
    }
  }
}

const transData = () => {
  for(let dt of data.value) {
    for(let d in dt) {
      let param = {
        sLang: props.searchParams.LANGUAGE, //번역할언어
        sText: dt[d], //번역할말
      }

      // 빈값이면 continue
      if(isEmpty(param.sText)) continue

      chatbotTranslateLn(param).then((res) => {
        dt[d] = res.TRANSATED_WORD
      })
    }
  }
}

const getDetail = () => {
  return data.value
}

const btnText = (dt) => {
  let result = {TXT: '', COLOR: 'background: #1A40C7 !important;'}
  let temp1 = data.value.filter(item => item.GBN_NO == dt.GBN_NO && item.SEQ == '1')
  let temp2 = data.value.filter(item => item.GBN_NO == dt.GBN_NO && item.SEQ == '1' && item.STATUS == '2')
  if(temp1.length == temp2.length) {
    result.TXT = '보정 완료'
  } else if (temp2.length == 0) {
    result.TXT = '보정 필요'
    result.COLOR = 'background: #df7e41 !important;'
  } else {
    result.TXT = '보정 진행 중'
    result.COLOR = 'background: #4bc91e !important;'
  }
  return result
}

const deleteIconClick = (data, delete_type) => {
  let param = data
  // 삭제 구역 구분 ( L : 위험구분, M : 단위 공정, S : 위험요인 )
  param.REV_NO = props.searchParams.SEQ
  param.DELETE_TYPE = delete_type

  new deleteFlowHelper(vm, t)
    .setConfirmMessage('삭제 하시겠습니까?')
    .setQuery(deleteData, param)
    .setAfter(afterDelete)
    .run()
}

const deleteData = (param) => {
  return commonExecuteApi({ queryId : 'HLTAB0010_DELETE_01', list: [param] })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

defineExpose({
  getData,
  transData,
  getDetail, 
  saveData
})
</script>

<template>
  <div class="text-right">
    <v-btn @click="onButtonsClick({ id: 'btnNewRegular' })"> 추가 </v-btn>
  </div>
  <v-sheet class="mt-3 tb_div">
    <table class="tb">
      <thead>
        <tr>
          <td style="width:8%;">
            <h4>위험 구분</h4>
            <VDivider :thickness="1" length="100%" class="border-opacity-100" color="primary" />
          </td>
          <td style="width:15%;">
            <h4>단위 공정(직무)</h4>
            <VDivider :thickness="1" length="100%" class="border-opacity-100" color="primary" />
          </td>
          <td style="width:15%;">
            <h4>위험요인</h4>
            <VDivider :thickness="1" length="100%" class="border-opacity-100" color="primary" />
          </td>
          <td style="width:5%;">
            <h4>빈도</h4>
            <VDivider :thickness="1" length="100%" class="border-opacity-100" color="primary" />
          </td>
          <td style="width:5%;">
            <h4>강도</h4>
            <VDivider :thickness="1" length="100%" class="border-opacity-100" color="primary" />
          </td>
          <td colspan="3" style="width:13%;">
            <h4>위험성</h4>
            <VDivider :thickness="1" length="100%" class="border-opacity-100" color="primary" />
          </td>
          <td colspan="2" style="width:8%;">
            <h4>위험성 보정</h4>
            <VDivider :thickness="1" length="100%" class="border-opacity-100" color="primary" />
          </td>
          <td style="width:15%;">
            <h4>현행 보건 위험성 감소 대책</h4>
            <VDivider :thickness="1" length="100%" class="border-opacity-100" color="primary" />
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(dt, i) in data" :key="i">
          <td style="width:5%;" class="pl-1 pr-1">
            <div style="width: 100%;">
              <div
                v-if="dt.SHOW_GBN_NM"
                class="box-border show-text text-left"
                width="100%" 
              >{{ dt.SHOW_GBN_NM }}
                <v-icon v-if="dt.WRITE_YN === 'Y'"
                    color="red"
                    icon="mdi-window-close"
                    size="x-small"
                    end="true"    
                    @click="deleteIconClick(dt, 'L')"             
                  />
              </div>
            </div>
          </td>
          <td style="width:16%;" class="pl-1 pr-1">
            <div style="width: 100%;" >
              <div
                class="box-border show-text text-left"
                v-if="dt.SHOW_PROCESS_NM"
                width="100%" 
              >{{ dt.SHOW_PROCESS_NM }}
                <v-icon v-if="dt.WRITE_YN === 'Y'"
                  color="red"
                  icon="mdi-window-close"
                  size="x-small"
                  end="true"
                  @click="deleteIconClick(dt, 'M')"
                />
              </div>
            </div>
          </td>
          <td style="width:17%;">
            <div style="width: 100%;">
              <div
                v-if="dt.HARM_NM"
                class="box-border show-text text-left"
                width="100%" 
              >{{ dt.HARM_NM }}
                <v-icon v-if="dt.WRITE_YN === 'Y'"
                  color="red"
                  icon="mdi-window-close"
                  size="x-small"
                  end="true"
                  @click="deleteIconClick(dt, 'S')"
                />
              </div>
            </div>
          </td>
          <td style="width:5%;" class="pl-1 pr-1">
            <div style="width: 100%;">
              <div
                v-if="dt.RATIO_CATEGORY !== null && dt.RATIO_CATEGORY !== undefined"
                :class="dt.MAX_YN == 'Y' ? 'box-border show-text highlight-background' : 'box-border show-text'"
                width="100%"
                
              >{{ dt.RATIO_CATEGORY }}</div>
            </div>
          </td>
          <td style="width:5%;" class="pl-1 pr-1">
            <div style="width: 100%;">
              <div
                v-if="dt.FINAL_SCORE !== null && dt.FINAL_SCORE !== undefined"
                :class="dt.MAX_YN == 'Y' ? 'box-border show-text highlight-background' : 'box-border show-text'"
                width="100%" 
              >{{ dt.FINAL_SCORE }}</div>
            </div>
          </td>

          <td style="width:3%;" class="pl-1">
            <div v-if="dt.SEQ == '1'">
              보정 전
            </div>
            <div v-else-if="dt.SEQ == '2'">
              보정 후
            </div>
          </td>
          <td style="width:4%;" class="pr-1">
            <div
              v-if="dt.SEQ == '1' && dt.MAX_POINT"
              class="box-border show-text"
              width="100%" 
            >{{ dt.MAX_POINT }} 점</div>
            <div
              v-else-if="dt.SEQ == '2'"
              class="box-border show-text"
              width="100%" 
            >{{ dt.MAX_POINT }}</div>
          </td>
          <td style="width:6%;" class="pr-1">
            <div
              v-if="dt.SEQ == '1' && dt.CLASSIFICATION_NM"
              class="box-border show-text"
              width="100%"
              :style="'background:' + classificaitonColor[dt.CLASSIFICATION]"
            >{{ dt.CLASSIFICATION_NM }}</div>
            <div
              v-else-if="dt.SEQ == '2'"
              class="box-border show-text"
              width="100%"
              :style="'background:' + classificaitonColor[dt.CLASSIFICATION]"
            >{{ dt.CLASSIFICATION_NM }}</div>
          </td>

          <td style="width:7%;" class="pl-1 pr-1">
            <div v-if="dt.SEQ == '1'">
              <v-btn
                @click="btnAdjust(dt)"
                :style="btnText(dt).COLOR"
              >
                {{ btnText(dt).TXT}}
              </v-btn>
              <!-- <v-btn
                v-if="dt.STATUS == 2"
                @click="btnAdjust(dt)"
              >
                보정 완료
              </v-btn>
              <v-btn
                v-else-if="dt.STATUS == 1"
                @click="btnAdjust(dt)"
                style="background: #4bc91e !important;"
              >
                보정 진행 중
              </v-btn>
              <v-btn
                v-else
                @click="btnAdjust(dt)"
                style="background: #df7e41 !important;"
              >
                보정 필요
              </v-btn> -->
            </div>
            <div v-else-if="dt.SEQ == '2'">
              직업병 유소견(D1)
            </div>
          </td>
          <td style="width:3%;" class="pl-1 pr-1">
            <div v-if="dt.SEQ == '2'">
              <div
                class="box-border show-text"
                width="100%" 
              >{{ dt.PROCESS_CNT }} 명</div>
            </div>
            <div v-if="dt.SEQ == '1'" class="text-center">
              <v-tooltip :open-on-hover="false" open-on-click>
                <template v-slot:activator="{ props }">
                  <v-icon 
                    color="info" 
                    icon="mdi-information"
                    size="x-large"
                    v-bind="props">
                  </v-icon>
                </template>
                <span>{{  dt.TIP }}</span>
              </v-tooltip>
            </div>
          </td>

          <td v-if="dt.SEQ == '1'" rowspan="2" style="width:10%;" class="pl-1 pr-1">
            <i-textarea
              v-model="dt.GUIDE"
              width="100%" 
              row="3"
              bgColor="#eff8fd"                         
            ></i-textarea>
          </td>          
        </tr>
      </tbody>
    </table>
  </v-sheet>
  <HLTAB0010Tab02Popup01 ref="popup01" @after-search="getData"/>
  <HLTAB0010Tab02Popup03 ref="popup03" @after-search="getData"/>
  <HLTAB0010Tab02Popup04 ref="popup04" @after-search="getData"/>
</template>
<style scoped>

.tb_div {
  height: calc(75vh);
  overflow : auto;
}

.tb thead {
  background-color: white;
  position : sticky;
  top : 0;
  z-index: 10; 
}

.box-border {
  border: 1px solid #ccc;
  border-radius: 3px;
  text-align: center;
}

.show-text {
  padding: 4px;
  font-size: 14px;
  padding-left: 10px;
  padding-right: 10px;
  min-height: 20px;
}

.black-text {
  color:black !important;
}

tr {
  vertical-align: top;
}

.highlight-background {
  background-color: #abb0ff;
}
</style>
