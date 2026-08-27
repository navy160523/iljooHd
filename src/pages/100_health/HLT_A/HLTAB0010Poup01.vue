<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import Message from '@hiway/utils/notify'
import HLTAB0010Pop01Pop01 from '@/pages/100_health/HLT_A/HLTAB0010Popup01_Pop01.vue'
import _ from 'lodash'

const emit = defineEmits(['after-search'])
const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const exPop = ref(null)
const classificaitonColor = ref({
  '매우높음[5단계]': '#FA8072',
  '높음[4단계]': '#FFA07A',
  '보통[3단계]': '#FFFF00',
  '낮음[2단계]': '#90EE90',
  '매우낮음[1단계]': '#3CB371'
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  SEQ: '',
  GBN_NO: 'A',
  PROCESS_CD: '',
  PROCESS_NM: '',
  RATIO_CATEGORY_A: '1',
  RATIO_CATEGORY_B: '1',
  RATIO_CATEGORY_C: '1',
  FINAL_SCORE_A: '1',
  FINAL_SCORE_B: '1',
  FINAL_SCORE_C: '1',
  RESULT_A: '',
  RESULT_B: '',
  RESULT_C: '',
  RESULT: '',
  A_A_A: '',
  A_A_A_A: '',
  A_A_B: '',
  A_A_B_A: '',
  A_B_A: '',

  B_A_A: '',

  C_CATEGORY: [],
  C_CATEGORY_NAME: [],
  C_A_A: '',
  C_B_A: '',
})

const codeList = reactive({
  GBN_NO: [
    { COD: 'A', TXT: '화학물질 노출'},
    { COD: 'B', TXT: '소음 노출'},
    { COD: 'C', TXT: '근골격계 부담수준'},
  ],
  GRADE: [],

  A_A_A: [ // 빈도 영향요인 - 일평균 제품 취급량
    { COD: 'A', TXT: '1kg(ℓ) 미만'},
    { COD: 'B', TXT: '1~10kg(ℓ) 미만'},
    { COD: 'C', TXT: '10~100kg(ℓ) 미만'},
    { COD: 'D', TXT: '100~500kg(ℓ) 미만'},
    { COD: 'E', TXT: '500kg(ℓ) 이상'},
  ],
  A_A_A_A: [], // 빈도 영향요인 - 비산성/휘발성
  A_A_B: [],
  A_A_B_A: [],
  A_B_A: [],// 주요 취급 화학제품 선택
  A_B_B: [],

  B_A_A: [
    { COD: 'A', TXT: '일상 작업 소음 또는 귀에 큰 불편함 없음'},
    { COD: 'B', TXT: '간헐적 소음 작업 (장비 신호음, 가공, 조립 등) 또는 소음 발생 시 일시적으로 불편함'},
    { COD: 'C', TXT: '연속 소음 작업 (시운전, 설비 운전/가동음 등) 또는 연속되는 소음에 귀가 피로함'},
    { COD: 'D', TXT: '강렬한 소음작업 (그라인딩 소음 등) 또는 귀가 아프거나 집중력을 저해함'},
  ],
  B_A_A_A: [],
  B_A_B: [],
  B_A_B_A: [],
  B_B_A: [],

  C_CATEGORY: [
    { code: 'A', label: '해당 없음' },
    { code: 'B', label: '중량물 (5kg 이상) 취급 작업' },
    { code: 'C', label: '반복 동작 작업' },
    { code: 'D', label: '부적절한 작업자세 (쪼그림, 무릎 꿇고 작업 등)' },
    { code: 'E', label: '진동 작업 (그라인더, 임팩트 드릴 등)' },
    { code: 'F', label: '날카로운 면과의 신체 접촉 (작업대 모서리, 공구 등)' },
  ],
  C_A_A: [], // 근골 빈도
  C_B_A: [],
  
})

const openPopup = (params) => {
  
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.ASGN_CD = params.ASGN_CD
  searchParams.YEAR = params.YEAR
  searchParams.SEQ = params.SEQ
  // commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_TYPE', param: searchParams }).then(async res => {
  //   for(let p of res.ORESULT_CUR) {
  //     commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: {...searchParams, ...p } }).then(r => {
  //       codeList[`${p.CATEGORY_MA}_${p.CATEGORY_ME}_${p.CATEGORY_SU}`] = r.ORESULT_CUR

  //       console.log(codeList)
  //     })
  //   }
  // })

  Promise.all([
    // 주요 취급 화학제품 선택
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: 'ABA'} }),
    // 부서
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: 'CAA'} }),
    // 등급 조회
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_GRADE', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: 'CAA'} }),
  ]).then((res) => {
    codeList.A_B_A = res[0].ORESULT_CUR
    codeList.C_A_A = res[1].ORESULT_CUR
    codeList.GRADE = res[2].ORESULT_CUR
  })
  dialog.value = true
}

const closePopup = () => {
  // 변수 초기화
  for(let key in searchParams) {
    searchParams[key] = ''
  }
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.GBN_NO = 'A'
  searchParams.RATIO_CATEGORY_A = '1'
  searchParams.RATIO_CATEGORY_B = '1'
  searchParams.RATIO_CATEGORY_C = '1'
  searchParams.FINAL_SCORE_A = '1'
  searchParams.FINAL_SCORE_B = '1'
  searchParams.FINAL_SCORE_C = '1'
  searchParams.C_CATEGORY = []
  searchParams.C_CATEGORY_NAME = []
  emit('after-search')
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnUpdate') {
    if(isEmpty(searchParams.PROCESS_NM)) {
      return Message.warn(t('공정명은 필수입니다.'))  
    } else if (isEmpty(searchParams.A_B_A) && searchParams.GBN_NO == 'A') {
      return Message.warn(t('취급 화학제품을 선택해주십시오.'))
    } else if (isEmpty(searchParams.C_CATEGORY) && searchParams.GBN_NO == 'C') {
      return Message.warn(t('근골격계질환 유발 작업 유형을 선택해주십시오.'))
    }

    vm.$swal({
      title: t(`저장하시겠습니까?`),
      showCancelButton: true,
    }).then(r => {
      if (r.isConfirmed) {
        let saveParams = []
        let saveParam = {}
        saveParam.CMPNY_DIV = searchParams.CMPNY_DIV
        saveParam.BSNS_CD = searchParams.BSNS_CD
        saveParam.DEPT_CD = searchParams.DEPT_CD
        saveParam.ASGN_CD = searchParams.ASGN_CD
        saveParam.YEAR = searchParams.YEAR
        saveParam.SEQ = searchParams.SEQ
        saveParam.GBN_NO = searchParams.GBN_NO
        saveParam.GBN_NM = codeList.GBN_NO.find(item => item.COD == searchParams.GBN_NO).TXT
        saveParam.PROCESS_NM = searchParams.PROCESS_NM
        if(searchParams.GBN_NO == 'A') {
          saveParam.HARM_CD = searchParams.A_B_A
          saveParam.HARM_NM = codeList.A_B_A.find(item => item.COD == searchParams.A_B_A).TXT
          saveParam.RATIO_CATEGORY = searchParams.RATIO_CATEGORY_A
          saveParam.FINAL_SCORE = searchParams.FINAL_SCORE_A
          saveParam.POINT = searchParams.RATIO_CATEGORY_A * searchParams.FINAL_SCORE_A
          saveParams.push(saveParam)
        } else if (searchParams.GBN_NO == 'B') {
          saveParam.HARM_CD = '31001'
          saveParam.HARM_NM = '소음'
          saveParam.RATIO_CATEGORY = searchParams.RATIO_CATEGORY_B
          saveParam.FINAL_SCORE = searchParams.FINAL_SCORE_B
          saveParam.POINT = searchParams.RATIO_CATEGORY_B * searchParams.FINAL_SCORE_B
          saveParams.push(saveParam)
        } else if (searchParams.GBN_NO == 'C') {
          saveParam.RATIO_CATEGORY = searchParams.RATIO_CATEGORY_C
          saveParam.FINAL_SCORE = searchParams.FINAL_SCORE_C
          saveParam.POINT = searchParams.RATIO_CATEGORY_C * searchParams.FINAL_SCORE_C
          for(let i = 0; i < searchParams.C_CATEGORY.length; i++) {
            let param = _.cloneDeep(saveParam)
            param.HARM_CD = searchParams.C_CATEGORY[i]
            param.HARM_NM = searchParams.C_CATEGORY_NAME[i]  
            saveParams.push(param)
          }
        }
        commonExecuteApi({ queryId : 'HLTAB0010_SAVE_06', list: saveParams }).then(res => {
          
          // OUT_RES_CNT : insert 실행 수 ( 없으면 중복때문에 insert가 안됨 )          
          if(Number(res.list[0].OUT_RES_CNT) > 0) {
            Message.success(t('성공적으로 저장되었습니다.'))
            closePopup()
          }else {
            Message.warn(t('중복된 공정의 위험요인이 있습니다.'))
            return
          }
        })
      }
    })
  }
}

const clickExample = () => {
  exPop.value.openPopup()
}

const clickCheck = (e) => {
  if(isEmpty(e)) return

  searchParams.A_B_A = e.COD
  searchParams.FINAL_SCORE_A = e.POINT // 강도 변경
}

const clickBone = (e, name) => {
  if(isEmpty(e)) return

  const idx = searchParams.C_CATEGORY.indexOf(e)
  if (e == 'A') {
    if (idx >= 0) {
      searchParams.C_CATEGORY = []
      searchParams.C_CATEGORY_NAME = []
    } else {
      searchParams.C_CATEGORY = [e]
      searchParams.C_CATEGORY_NAME = [name]
    }
    
  } else {
    const aIdx = searchParams.C_CATEGORY.indexOf('A') // 해당없음 삭제
    if(aIdx >= 0) { 
      searchParams.C_CATEGORY.splice(aIdx, 1) // 제거
      searchParams.C_CATEGORY_NAME.splice(aIdx, 1)
    } 

    if (idx >= 0) {
      searchParams.C_CATEGORY.splice(idx, 1) // 제거
      searchParams.C_CATEGORY_NAME.splice(idx, 1)
    } else {
      searchParams.C_CATEGORY.push(e) // 추가
      searchParams.C_CATEGORY_NAME.push(name)
    }
  } 
  console.log(searchParams.C_CATEGORY)
}

watch(() => searchParams.A_A_A, (newValue, oldValue) => {
  searchParams.A_A_A_A = ''
  commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: 'AAA' + newValue} }).then(res => {
    codeList.A_A_A_A = res.ORESULT_CUR
  })
})

// 비산성/휘발성 조합 변경시 빈도 변경
watch(() => [searchParams.A_A_A_A, searchParams.A_A_B_A], (newValue, oldValue) => {
  if(isEmpty(searchParams.A_A_A_A) || isEmpty(searchParams.A_A_B_A)) return
  let p1 = codeList.A_A_A_A.find(item => item.COD == searchParams.A_A_A_A).POINT
  let p2 = codeList.A_A_B_A.find(item => item.COD == searchParams.A_A_B_A).POINT
  searchParams.RATIO_CATEGORY_A = Number(p1) + Number(p2) 
  if(searchParams.RATIO_CATEGORY_A < 1) searchParams.RATIO_CATEGORY_A = 1
  else if (searchParams.RATIO_CATEGORY_A > 5) searchParams.RATIO_CATEGORY_A = 5
})

watch(() => searchParams.A_A_B, (newValue, oldValue) => {
  searchParams.A_A_B_A = ''
  commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: newValue} }).then(res => {
    codeList.A_A_B_A = res.ORESULT_CUR
  })
})

watch(() => searchParams.B_A_A, (newValue, oldValue) => {
  searchParams.B_A_A_A = ''
  commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: 'BAA' + newValue} }).then(res => {
    codeList.B_A_A_A = res.ORESULT_CUR
  })
})

// 소음원 일평균 노출시간에 따른 빈도값 변경
watch(() => [searchParams.B_A_A_A, searchParams.B_A_B_A], (newValue, oldValue) => {
  if(isEmpty(searchParams.B_A_A_A) || isEmpty(searchParams.B_A_B_A)) return
  let p1 = codeList.B_A_A_A.find(item => item.COD == searchParams.B_A_A_A).POINT
  let p2 = codeList.B_A_B_A.find(item => item.COD == searchParams.B_A_B_A).POINT
  searchParams.RATIO_CATEGORY_B = Number(p1) + Number(p2) 
  if(searchParams.RATIO_CATEGORY_B < 1) searchParams.RATIO_CATEGORY_B = 1
  else if (searchParams.RATIO_CATEGORY_B > 5) searchParams.RATIO_CATEGORY_B = 5
})

watch(() => searchParams.B_A_B, (newValue, oldValue) => {
  commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: newValue} }).then(res => {
    codeList.B_A_B_A = res.ORESULT_CUR
  })
})

// 일 평균 작업시간에 따른 강도 변경
watch(() => searchParams.B_B_A, (newValue, oldValue) => {
  searchParams.FINAL_SCORE_B = newValue == 'BBAA' ? 3 : 2
})

// 평균 작업 빈도(근골)
watch(() => searchParams.C_A_A, (newValue, oldValue) => {
  if(isEmpty(newValue)) return
  searchParams.RATIO_CATEGORY_C = codeList.C_A_A.find(item => item.COD == newValue).POINT
})

watch(() => searchParams.C_B_B, (newValue, oldValue) => {
  commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: newValue} }).then(res => {
    codeList.C_B_A = res.ORESULT_CUR
  })
})

watch(() => [searchParams.C_CATEGORY, searchParams.C_B_B], (newValue, oldValue) => {
  if(isEmpty(searchParams.C_CATEGORY) || isEmpty(searchParams.C_B_B)) return

  if(searchParams.C_B_B == 'CBAB') {
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: 'CBAC'} }).then(res => {
      codeList.C_B_A = res.ORESULT_CUR
    })
  } else if (searchParams.C_CATEGORY.includes('A')) {
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: 'CBAA'} }).then(res => {
      codeList.C_B_A = res.ORESULT_CUR
    })
  } else {
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_COMBO_LIST', param: { CMPNY_DIV: searchParams.CMPNY_DIV, YEAR: searchParams.YEAR, COD: 'CBAB'} }).then(res => {
      codeList.C_B_A = res.ORESULT_CUR
    })
  } 
})

// 작업 형태 및 주관적 작업부하 체감정도
watch(() => searchParams.C_B_A, (newValue, oldValue) => {
  if(isEmpty(newValue)) return
  searchParams.FINAL_SCORE_C = codeList.C_B_A.find(item => item.COD == newValue).POINT
})

watch(() => [searchParams.RATIO_CATEGORY_A, searchParams.FINAL_SCORE_A], async (newValue, oldValue) => {
  await nextTick()
  if(isEmpty(searchParams.RATIO_CATEGORY_A) || isEmpty(searchParams.FINAL_SCORE_A)) return
  let result = Number(searchParams.RATIO_CATEGORY_A) * Number(searchParams.FINAL_SCORE_A)
  console.log(codeList.GRADE[0])
  if(result >= codeList.GRADE[0].A) {
    searchParams.RESULT_A = '매우높음[5단계]'
  } else if (result >= codeList.GRADE[0].B) {
    searchParams.RESULT_A = '높음[4단계]'
  } else if (result >= codeList.GRADE[0].C) {
    searchParams.RESULT_A = '보통[3단계]'
  } else if (result >= codeList.GRADE[0].D) {
    searchParams.RESULT_A = '낮음[2단계]'
  } else if (result >= codeList.GRADE[0].E) {
    searchParams.RESULT_A = '매우낮음[1단계]'
  }
  
})

watch(() => [searchParams.RATIO_CATEGORY_B, searchParams.FINAL_SCORE_B], async (newValue, oldValue) => {
  await nextTick()
  if(isEmpty(searchParams.RATIO_CATEGORY_B) || isEmpty(searchParams.FINAL_SCORE_B)) return
  let result = Number(searchParams.RATIO_CATEGORY_B) * Number(searchParams.FINAL_SCORE_B)
  if(result >= codeList.GRADE[0].A) {
    searchParams.RESULT_B = '매우높음[5단계]'
  } else if (result >= codeList.GRADE[0].B) {
    searchParams.RESULT_B = '높음[4단계]'
  } else if (result >= codeList.GRADE[0].C) {
    searchParams.RESULT_B = '보통[3단계]'
  } else if (result >= codeList.GRADE[0].D) {
    searchParams.RESULT_B = '낮음[2단계]'
  } else if (result >= codeList.GRADE[0].E) {
    searchParams.RESULT_B = '매우낮음[1단계]'
  }
})

watch(() => [searchParams.RATIO_CATEGORY_C, searchParams.FINAL_SCORE_C], async (newValue, oldValue) => {
  await nextTick()
  if(isEmpty(searchParams.RATIO_CATEGORY_C) || isEmpty(searchParams.FINAL_SCORE_C)) return
  let result = Number(searchParams.RATIO_CATEGORY_C) * Number(searchParams.FINAL_SCORE_C)
  if(result >= codeList.GRADE[0].A) {
    searchParams.RESULT_C = '매우높음[5단계]'
  } else if (result >= codeList.GRADE[0].B) {
    searchParams.RESULT_C = '높음[4단계]'
  } else if (result >= codeList.GRADE[0].C) {
    searchParams.RESULT_C = '보통[3단계]'
  } else if (result >= codeList.GRADE[0].D) {
    searchParams.RESULT_C = '낮음[2단계]'
  } else if (result >= codeList.GRADE[0].E) {
    searchParams.RESULT_C = '매우낮음[1단계]'
  }
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>위험요인 등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnUpdate', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div v-if="searchParams.GBN_NO == 'A'">
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="h-grow">
            <v-sheet width="50%">
              <div class="searchArea">
                <div class="d-flex">
                  <div class="mt-2 mr-3 title">위험요인 선택</div>
                  <div>
                    <v-radio-group 
                      v-model="searchParams.GBN_NO"
                      inline
                    >
                      <v-radio 
                        v-for="item in codeList.GBN_NO"
                        :key="item"
                        :value="item.COD"
                        :label="item.TXT"
                      />
                    </v-radio-group>
                  </div>
                </div>
                <div class="d-flex mt-2">
                  <div class="mr-3 mt-2 title">대상 공정명(직무명)</div>
                  <i-input
                    width="250px"
                    v-model="searchParams.PROCESS_NM"
                    required
                  ></i-input>
                </div>
              </div>
              <div class="searchArea mt-2 fill-height">
                <div class="title mb-2">주요 취급 화학제품 선택</div>
                <vRow v-for="(i, idx) in Math.trunc(codeList.A_B_A.length / 4) + 1" :key="idx" class="mt-1">
                  <vCol cols="3" v-if="(i - 1) * 4 + 0 < codeList.A_B_A.length">
                    <v-checkbox 
                      @click="clickCheck(codeList.A_B_A[(i - 1) * 4 + 0])" 
                      :label="codeList.A_B_A[(i - 1) * 4 + 0]?.TXT" 
                      :model-value="searchParams.A_B_A"
                    />
                  </vCol>
                  <vCol cols="3" v-if="(i - 1) * 4 + 1 < codeList.A_B_A.length">
                    <v-checkbox 
                      @click="clickCheck(codeList.A_B_A[(i - 1) * 4 + 1])" 
                      :label="codeList.A_B_A[(i - 1) * 4 + 1]?.TXT" 
                      :model-value="searchParams.A_B_A"
                    />
                  </vCol>
                  <vCol cols="3" v-if="(i - 1) * 4 + 2 < codeList.A_B_A.length">
                    <v-checkbox 
                      @click="clickCheck(codeList.A_B_A[(i - 1) * 4 + 2])" 
                      :label="codeList.A_B_A[(i - 1) * 4 + 2]?.TXT" 
                      :model-value="searchParams.A_B_A"
                    />
                  </vCol>
                  <vCol cols="3" v-if="(i - 1) * 4 + 3 < codeList.A_B_A.length">
                    <v-checkbox 
                      @click="clickCheck(codeList.A_B_A[(i - 1) * 4 + 3])" 
                      :label="codeList.A_B_A[(i - 1) * 4 + 3]?.TXT" 
                      :model-value="searchParams.A_B_A"
                    />
                  </vCol>
                </vRow>
              </div>
            </v-sheet>
            <div class="mx-2"></div>
            <v-sheet width="50%">
              <div class="searchArea">
                <div class="title mb-2">빈도 영향 요인</div>
                <i-select
                  :label="$t('∘ 일평균 제품 취급량')" 
                  width="500px"
                  label-width="200px"
                  :items="codeList.A_A_A"
                  v-model="searchParams.A_A_A"
                  item-value="COD"
                  item-title="TXT"
                ></i-select>
                <i-select
                  :label="$t('∘ 비산성/휘발성')" 
                  width="500px"
                  class="mt-2"
                  label-width="200px"
                  :items="codeList.A_A_A_A"
                  v-model="searchParams.A_A_A_A"
                  item-value="COD"
                  item-title="TXT"
                  :readonly="isEmpty(searchParams.A_A_A)"
                ></i-select>
                <div class="d-flex mt-2">
                  <div style="width:220px;">∘ 주 작업 장소</div>
                  <div>
                    <v-radio-group 
                      inline 
                      v-model="searchParams.A_A_B"
                    >
                      <v-radio label="실내" value="AABA"></v-radio>
                      <v-radio label="실외" value="AABB"></v-radio>
                    </v-radio-group>
                  </div>
                </div>
                <i-select
                  :label="$t('∘ 작업공정의 밀폐/환기상태')" 
                  width="500px"
                  label-width="200px"
                  class="mt-2"
                  :items="codeList.A_A_B_A"
                  v-model="searchParams.A_A_B_A"
                  item-value="COD"
                  item-title="TXT"
                  :readonly="isEmpty(searchParams.A_A_B)"
                ></i-select>
              </div>
              <div class="searchArea mt-2">
                <div class="title mb-2">강도 영향 요인</div>
                <div>
                  <div class="d-flex mt-2"> 
                    <div style="width:220px;">∘ 특별관리물질 포함 여부</div>
                    <div>
                      <v-radio-group inline>
                        <v-radio label="포함" value="Y"></v-radio>
                        <v-radio label="미포함" value="N"></v-radio>
                      </v-radio-group>
                    </div>
                  </div>
                  <div class="d-flex mt-2">
                    <div style="width:220px;">∘ 공정(직무) 내 직업병 유소견자 발생 여부</div>
                    <div>
                      <v-radio-group inline>
                        <v-radio label="발생" value="Y"></v-radio>
                        <v-radio label="미발생" value="N"></v-radio>
                        <v-radio label="모름" value=""></v-radio>
                      </v-radio-group>
                    </div>
                  </div>
                </div>
              </div>
            </v-sheet>
          </div>
          <div class="d-flex">
            <v-btn class="mr-2 button-est">추정치 산출</v-btn>
            <v-sheet class="searchArea d-flex" width="100%">
              <i-input
                width="200px" 
                label="빈도"
                v-model="searchParams.RATIO_CATEGORY_A"
                readonly
              ></i-input>
              <i-input 
                width="200px" 
                label="강도"
                v-model="searchParams.FINAL_SCORE_A"
                readonly
              ></i-input>
              <div class="mt-2 mr-2">위험성 추정치</div>
              <div 
                class="box-border show-text"
                :style="'background:' + classificaitonColor[searchParams.RESULT_A]"
              >{{ searchParams.RESULT_A }}</div>
            </v-sheet>
          </div>
        </v-card-text>
      </div>

      <div v-else-if="searchParams.GBN_NO == 'B'">
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex">
            <v-sheet width="50%">
              <div class="searchArea fill-height">
                <div class="d-flex">
                  <div class="mt-2 mr-3 title">위험요인 선택</div>
                  <div>
                    <v-radio-group 
                      v-model="searchParams.GBN_NO"
                      inline
                    >
                      <v-radio 
                        v-for="item in codeList.GBN_NO"
                        :key="item"
                        :value="item.COD"
                        :label="item.TXT"
                      />
                    </v-radio-group>
                  </div>
                </div>
                <div class="d-flex mt-2">
                  <div class="mr-3 mt-2 title">대상 공정명(직무명)</div>
                  <i-input 
                    width="250px"
                    v-model="searchParams.PROCESS_NM"
                    required
                  ></i-input>
                </div>
              </div>
            </v-sheet>
            <div class="mx-2"></div>
            <v-sheet width="50%">
              <div class="searchArea">
                <div class="title">노출 보정 요인</div>
                <div class="d-flex mt-2">
                  <div style="width:220px;">∘ 청력 보호구 착용 여부</div>
                  <div class="ml-2">
                    <v-radio-group 
                      inline
                      v-model="searchParams.B_A_B"
                    >
                      <v-radio label="착용" value="BABB"></v-radio>
                      <v-radio label="미착용" value="BABA"></v-radio>
                    </v-radio-group>
                  </div>
                </div>
                <i-select
                  :label="$t('∘ 소음원/전달경로 관리 방법')" 
                  width="500px"
                  label-width="200px"
                  :items="codeList.B_A_B_A"
                  v-model="searchParams.B_A_B_A"
                  class="mt-2"
                  item-value="COD"
                  item-title="TXT"
                  :readonly="isEmpty(searchParams.B_A_B)"
                ></i-select>
                <div class="d-flex mt-2">
                  <div style="width:220px;">∘ 일 평균 작업시간</div>
                  <div class="ml-2">
                    <v-radio-group 
                      inline
                      v-model="searchParams.B_B_A"
                    >
                      <v-radio label="6시간 이상" value="BBAA"></v-radio>
                      <v-radio label="6시간 미만" value="BBAB"></v-radio>
                    </v-radio-group>
                  </div>
                </div>
              </div>
            </v-sheet>
          </div>
          <div class="d-flex">
            <v-sheet width="100%">
              <div class="searchArea">
                <i-select
                  :label="$t('∘ 주 소음원의 형태 및 체감 정도')" 
                  width="800px"
                  label-width="200px"
                  :items="codeList.B_A_A"
                  v-model="searchParams.B_A_A"
                  item-value="COD"
                  item-title="TXT"
                ></i-select>
                <i-select
                  :label="$t('∘ 주 소음원 일평균 노출시간')" 
                  width="800px"
                  label-width="200px"
                  class="mt-2"
                  :items="codeList.B_A_A_A"
                  v-model="searchParams.B_A_A_A"
                  item-value="COD"
                  item-title="TXT"
                  :readonly="isEmpty(searchParams.B_A_A)"
                ></i-select>
              </div>
            </v-sheet>
          </div>
          <div class="d-flex">
            <v-btn class="mr-2 button-est">추정치 산출</v-btn>
            <v-sheet class="searchArea d-flex" width="100%">
              <i-input 
                width="200px" 
                label="빈도"
                v-model="searchParams.RATIO_CATEGORY_B"
                readonly
              ></i-input>
              <i-input 
                width="200px" 
                label="강도"
                v-model="searchParams.FINAL_SCORE_B"
                readonly
              ></i-input>
              <div class="mt-2 mr-2">위험성 추정치</div>
              <div 
                class="box-border show-text"
                :style="'background:' + classificaitonColor[searchParams.RESULT_B]"
              >{{ searchParams.RESULT_B }}</div>
            </v-sheet>
          </div>
        </v-card-text>
      </div>

      <div v-else-if="searchParams.GBN_NO == 'C'">
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="h-grow">
            <v-sheet width="50%">
              <div class="searchArea">
                <div class="d-flex">
                  <div class="mt-2 mr-3 title">위험요인 선택</div>
                  <div>
                    <v-radio-group 
                      v-model="searchParams.GBN_NO"
                      inline
                    >
                      <v-radio 
                        v-for="item in codeList.GBN_NO"
                        :key="item"
                        :value="item.COD"
                        :label="item.TXT"
                      />
                    </v-radio-group>
                  </div>
                </div>
                <div class="d-flex mt-2">
                  <div class="mr-3 mt-2 title">대상 공정명(직무명)</div>
                  <i-input 
                    width="250px"
                    v-model="searchParams.PROCESS_NM"
                    required
                  ></i-input>
                </div>
              </div>
              <div class="searchArea fill-height mt-2">
                <div class="title">작업시간 및 부하정도</div>
                <i-select
                  :label="$t('∘ 평균 작업 빈도')" 
                  width="500px"
                  label-width="200px"
                  :items="codeList.C_A_A"
                  v-model="searchParams.C_A_A"
                  item-value="COD"
                  item-title="TXT"
                ></i-select>
                <i-select
                  :label="$t('∘ 주관적인 작업 부하 정도')" 
                  width="500px"
                  label-width="200px"
                  class="mt-2"
                  :items="codeList.C_B_A"
                  v-model="searchParams.C_B_A"
                  item-value="COD"
                  item-title="TXT"
                  :readonly="isEmpty(searchParams.C_CATEGORY) || isEmpty(searchParams.C_B_B)"
                ></i-select>
              </div>
            </v-sheet>
            <div class="mx-2"></div>
            <v-sheet width="50%">
              <div class="searchArea fill-height">
                <div class="title">강도 영향 요인</div>
                <div class="d-flex mt-2">
                  <div style="220px;">∘ 근골격계질환 유발 작업 유형</div>
                  <div class="ml-2">
                    <!-- <v-checkbox @click="clickBone('A', '해당 없음')" :model-value="searchParams.C_CATEGORY" label="해당 없음" />
                    <v-checkbox @click="clickBone('B', '중량물 (5kg 이상) 취급 작업')" :model-value="searchParams.C_CATEGORY" label="중량물 (5kg 이상) 취급 작업" />
                    <v-checkbox @click="clickBone('C', '반복 동작 작업')" :model-value="searchParams.C_CATEGORY" label="반복 동작 작업" />
                    <v-checkbox @click="clickBone('D', '부적절한 작업자세 (쪼그림, 무릎 꿇고 작업 등)')" :model-value="searchParams.C_CATEGORY" label="부적절한 작업자세 (쪼그림, 무릎 꿇고 작업 등)" />
                    <v-checkbox @click="clickBone('E', '진동 작업 (그라인더, 임팩트 드릴 등)')" :model-value="searchParams.C_CATEGORY" label="진동 작업 (그라인더, 임팩트 드릴 등)" />
                    <v-checkbox @click="clickBone('F', '날카로운 면과의 신체 접촉 (작업대 모서리, 공구 등)')" :model-value="searchParams.C_CATEGORY" label="날카로운 면과의 신체 접촉 (작업대 모서리, 공구 등)" /> -->
                    <v-checkbox
                      v-for="item in codeList.C_CATEGORY"
                      :key="item.code"
                      :model-value="searchParams.C_CATEGORY.includes(item.code)"
                      :label="item.label"
                      :value="item.code"
                      @click="clickBone(item.code, item.label)"
                    />
                  </div>
                </div>
                <div class="d-flex mt-2">
                  <div style="220px;">∘ 근골격계질환 부담작업 여부</div>
                  <div class="ml-2">
                    <v-radio-group 
                      inline
                      v-model="searchParams.C_B_B"
                    >
                      <v-radio label="해당" value="CBAB"></v-radio>
                      <v-radio label="미해당" value="CBAA"></v-radio>
                    </v-radio-group>
                  </div>
                </div>
                <div class="d-flex">
                  <span class="mr-2 mt-2">∘ 고용노동부 고시로 정해진 11종의 근골격계 부담작업</span>
                  <v-btn
                    @click="clickExample"
                  >
                  예시
                  </v-btn>
                </div>
              </div>
            </v-sheet>
          </div>
          <div class="d-flex">
            <v-btn class="mr-2 button-est">추정치 산출</v-btn>
            <v-sheet class="searchArea d-flex" width="100%">
              <i-input 
                width="200px" 
                label="빈도"
                v-model="searchParams.RATIO_CATEGORY_C"
                readonly
              ></i-input>
              <i-input 
                width="200px" 
                label="강도"
                v-model="searchParams.FINAL_SCORE_C"
                readonly
              ></i-input>
              <div class="mt-2 mr-2">위험성 추정치</div>
              <div 
                class="box-border show-text"
                :style="'background:' + classificaitonColor[searchParams.RESULT_C]"
              >{{ searchParams.RESULT_C }}</div>
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
    <HLTAB0010Pop01Pop01 ref="exPop"/>
  </v-dialog>
</template>

<style scoped lang="scss">
.button-est {
  height: 58px;
}

.title {
  width: 170px;
  font-size: 16px;
  font-weight: bold;
}

.box-border {
  border: 1px solid #ccc;
  border-radius: 3px;
  text-align: center;
}

.show-text {
  padding: 5px;
  font-size: 15px;
  padding-left: 10px;
  padding-right: 10px;
  height: 34px;
  width: 150px;
}
</style>
