<!-- SAFFD0020 SLI 배점 관리표 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import IMenuTitle from '@/components/IMenuTitle.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

defineOptions({
  name:'30_safety-SAF_F-SAFFD0020',
})

const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy 
const menuTitle = ref(null)
const userStore = useUserStore()
const commonStore = useCommonStore()

const SAFFD0020_SHOW1 = ref(false)
const SAFFD0020_SHOW2 = ref(false)

const isReadOnly = ref(false)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  REV: '',
  REV_DESCR: '',
  APPLY_DT: null,
  USER_ID: userStore.userId,
  BATCH_YN: '',
  APPLY_YN: 'N'
})

const headers = reactive({
  header01: ['적용일자','비고','비율(%)'],                    // 기간별 감률
  header02: ['위험도 등급','현장 위험도(%)','가중치(%)'],      // 위험도 등급별
  header03: ['부서인원(인)', '가중치(%)'],                    // 인원별
  header04: ['기간(월)', '가중치(%)'],                       // 취약항목 반복
  header05: ['유형', '감점', '변수'],                        // 안전수칙
  header06: ['사고유형', '감점', '변수'],                     // 안전사고
  header07: ['유형', '감/가점'],                             // 안전교육
  header08: ['유형', '감/가점'],                             // 위험성평가
  header09: ['안전체크율', '감점'],                           // 현장 위험성평가
  header10: ['실적 기준', '비고', '값'],                     // 안전점검
  header11: ['실적 기준', '비고', '점수', '변수'],            // 안전점검2
  header12: ['실적 기준', '가점'],                        // 안전점검3
  header13: ['이행율', '가점'],                        // PTW 3중점검
})

const dataList = reactive({
  data1: [],
  data2: [],
  data3: [],
  data4: [],
  data5: [],
  data6: [],
  data7: [],
  data8: [],
  data9: [],
  data10: [],
  data11: [],
})

const codeList = reactive({
  REVList: []
})

const onButtonsClick = (btn , msg) => {
  if(btn.id === 'btnSearch'){
    search(msg)
  }else if(btn.id === 'btnNew'){
    addRev()
  }else if(btn.id === 'btnCopy'){
    copy()
  }else if(btn.id === 'btnUpdate'){
    save()
  }else if(btn.id === 'btnRskCopyApp'){
    apply()
  }
}

/* *************** 조회 *************** */
const search = msg => {
  let message = msg ? msg : '조회 되었습니다.'
  commonStore.loading = true
  commonSearchApi({ queryId : 'SAFFD0020_SEARCH_02', param: searchParam }).then(res => {
    commonStore.loading = false
    
    let i = 0
    Object.keys(dataList).forEach(() => {
      i++
      dataList['data' + i] = res['ORESULT_CUR' + i]
    })

    // for(let i = 1; i < 11; i++){
    //   dataList['data' + i] = res['ORESULT_CUR' + i]
    // }

    // console.log('dataList', dataList)

    Message.success(t(message))
  })

}

/* *************** 신규 *************** */
const addRev = async () => {
  let result = await vm.$swal({ 
    title: t('신규 생성 하시겠습니까? '), 
    showCancelButton: true,
  })
  if(!result.isConfirmed){
    return 
  }
  commonStore.loading = true
  commonExecuteApi({ queryId: "SAFFD0020_SAVE_01", list: [searchParam] }).then(() => {
    commonStore.loading = false
    initCodeList('신규 생성 되었습니다.')
  })
}

/* *************** 복사 *************** */
const copy = async () => {
  let result = await vm.$swal({ 
    title: t('복사 하시겠습니까? '), 
    showCancelButton: true,
  })
  if(!result.isConfirmed){
    return 
  }
  commonStore.loading = true
  commonExecuteApi({ queryId: "SAFFD0020_SAVE_02", list: [searchParam] }).then(() => {
    commonStore.loading = false
    initCodeList('복사 되었습니다.')
  })
}

/* *************** 저장(수정) *************** */
const save = async () => {
  let result = await vm.$swal({ 
    title: t('저장 하시겠습니까? '), 
    showCancelButton: true,
  })
  if(!result.isConfirmed){
    return 
  }

  let newArr = [
    ...dataList.data1,
    ...dataList.data2,
    ...dataList.data3,
    ...dataList.data4,
    ...dataList.data5,
    ...dataList.data6,
    ...dataList.data7,
    ...dataList.data8,
    ...dataList.data9,
    ...dataList.data10,
    ...dataList.data11,
  ]

  commonStore.loading = true
  commonExecuteApi({ queryId: "SAFFD0020_SAVE_03", list: newArr }).then(() => {
    commonStore.loading = false
    onButtonsClick({id: 'btnSearch'} , '저장 되었습니다.')
    // initCodeList('저장 되었습니다.')
  })
}

/* *************** 적용 *************** */
const apply = async () => {
  let result = await vm.$swal({ 
    title: t('적용 하시겠습니까? '), 
    showCancelButton: true,
  })
  if(!result.isConfirmed){
    return 
  }
  commonStore.loading = true
  commonExecuteApi({ queryId: "SAFFD0020_SAVE_04", list: [searchParam] }).then(() => {
    commonStore.loading = false
    initCodeList('적용 되었습니다.')
  })
}

/* *************** 버전 변경 *************** */
const revChange = () => {
  codeList.REVList.forEach(e => {
    if(searchParam.REV === e.REV){
      searchParam.APPLY_DT = e.APPLY_DT ? dayjs(e.APPLY_DT).format('YYYY-MM-DD') : ''
      searchParam.BATCH_YN = e.BATCH_YN
      searchParam.APPLY_YN = e.APPLY_YN
    }
  })

  isReadOnly.value = searchParam.BATCH_YN === 'Y' ? true : false
  onButtonsClick({id: 'btnSearch'})
}

const initCodeList = msg => {
  Promise.all([
    commonSearchApi({ queryId : 'SAFFD0020_SEARCH_01', param: {CMPNY_DIV: userStore.cmpnyDiv} })    // 버전 리스트 조회
  ]).then(res => {
    codeList.REVList = res[0].ORESULT_CUR

    /* 마지막 버전으로 초기값 세팅 */
    searchParam.REV = res[0].ORESULT_CUR[res[0].ORESULT_CUR.length - 1].REV
    searchParam.REV_DESCR = res[0].ORESULT_CUR[res[0].ORESULT_CUR.length - 1].REV_DESCR
    searchParam.APPLY_DT = res[0].ORESULT_CUR[res[0].ORESULT_CUR.length - 1].APPLY_DT ? dayjs(res[0].ORESULT_CUR[res[0].ORESULT_CUR.length - 1].APPLY_DT).format('YYYY-MM-DD') : ''
    searchParam.BATCH_YN = res[0].ORESULT_CUR[res[0].ORESULT_CUR.length - 1].BATCH_YN
    searchParam.APPLY_YN = res[0].ORESULT_CUR[res[0].ORESULT_CUR.length - 1].APPLY_YN

    isReadOnly.value = searchParam.BATCH_YN === 'Y' ? true : false
   
    onButtonsClick({id: 'btnSearch'}, msg)
  })
}

onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnNew',
          'btnCopy',
          'btnUpdate',
          'btnRskCopyApp',
        ]"
        @click-button="onButtonsClick"
        />
        <!-- 'btnPrint', -->
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between align-center ">
          <div class="d-flex">
            <i-select
              v-model="searchParam.REV"
              :items="codeList.REVList"
              :label="$t('버전')"
              labelWidth="40px"
              width="200px"
              item-value="REV"
              item-title="REV_DESCR"
              @update:model-value="revChange"
            />
            <i-input
              v-model="searchParam.APPLY_DT"
              :label="$t('적용일자')"
              width="220px"
              labelWidth="65px"
              readonly
            ></i-input>
            <v-checkbox
              :label="$t('적용여부')"
              v-model="searchParam.APPLY_YN"
              true-value="Y"
              false-value="N"
              disabled
            />
          </div>
          <div style="color: blue; font-size: 14px;">
            <div>
              - 변수 값은 취양항목 선정시 사용되는 값 입니다.
            </div>
            <div class="mt-1">
              - 배점관리표 적용 후 일일집계에 사용되면 값 수정이 불가능합니다.
            </div>
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <div class="d-flex fill-height">
            <v-sheet class="h-auto pa-2" width="40%">
              <v-card
                class="h-auto"
                border
              >
              <div class="flex-column h-auto table_area">
                <v-sheet class="d-flex" height="auto">
                  <v-sheet width="50%" class="pa-2">
                    <div class="title">기간별 감률</div>
                    <table>
                      <tr>
                        <th v-for="header in headers.header01" :key="header">{{ header }}</th>
                      </tr>
                      <tr v-for="content in dataList.data1" :key="content">
                        <td>{{ content.POINT_NM }}</td>
                        <td>{{ content.DESCR }}</td>
                        <td class="edit pa-0">
                          <v-text-field 
                            :maxlength="4" 
                            oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                            v-model="content.VALUE01" 
                            :readonly="isReadOnly"
                          />
                        </td>
                      </tr>
                    </table>
                  </v-sheet>
                  <v-sheet width="50%" class="pa-2">
                    <div class="title">위험도 등급별</div>
                    <table>
                      <tr>
                        <th v-for="item in headers.header02" :key="item">{{ item }}</th>
                      </tr>
                      <tr v-for="content in dataList.data2" :key="content">
                        <td>{{ content.POINT_NM }}</td>
                        <td>{{ content.DESCR }}</td>
                        <td class="edit pa-0">
                          <v-text-field 
                            :maxlength="4" 
                            oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                            v-model="content.VALUE01"
                            :readonly="isReadOnly"
                          />
                        </td>
                      </tr>
                    </table>
                  </v-sheet>
                </v-sheet>
                <v-sheet class="d-flex" height="auto">
                  <v-sheet width="50%" class="pa-2">
                    <div class="title">인원별</div>
                    <table>
                      <tr>
                        <th v-for="item in headers.header03" :key="item">{{ item }}</th>
                      </tr>
                      <tr v-for="content in dataList.data3" :key="content">
                        <td>{{ content.POINT_NM }}</td>
                        <td class="edit pa-0">
                          <v-text-field 
                            :maxlength="4" 
                            oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                            v-model="content.VALUE01"
                            :readonly="isReadOnly"
                          />
                        </td>
                      </tr>
                    </table>
                  </v-sheet>
                  <v-sheet width="50%" class="pa-2">
                    <div class="title">취약항목 반복</div>
                    <table>
                      <tr>
                        <th v-for="item in headers.header04" :key="item">{{ item }}</th>
                      </tr>
                      <tr v-for="content in dataList.data4" :key="content">
                        <td>{{ content.POINT_NM }}</td>
                        <td class="edit pa-0">
                          <v-text-field 
                            :maxlength="4" 
                            oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                            v-model="content.VALUE01"
                            :readonly="isReadOnly"  
                          />
                        </td>
                      </tr>
                    </table>
                  </v-sheet>
                </v-sheet>
              </div>
                
              </v-card>
            </v-sheet>
            <v-sheet class="h-auto pa-2" width="60%">
              <v-card
                class="h-auto pa-2"
                border
              >
                <div class="flex-column h-auto table_area">
                  <v-sheet class="d-flex" height="auto">
                    <v-sheet width="35%" class="pa-2">
                      <div class="title">안전수칙</div>
                      <table>
                        <tr>
                          <th v-for="header in headers.header05" :key="header">{{ header }}</th>
                        </tr>
                        <tr v-for="content in dataList.data5" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit2 pa-0">
                            <v-text-field 
                              :maxlength="4" 
                              oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                              v-model="content.VALUE01"
                              :readonly="isReadOnly"
                            />
                          </td>
                          <td class="edit pa-0">
                            <v-text-field 
                              :maxlength="4" 
                              oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                              v-model="content.VALUE02"
                              :readonly="isReadOnly"
                            />
                          </td>
                        </tr>
                      </table>
                    </v-sheet>
                    <v-sheet width="35%" class="pa-2">
                      <div class="title">안전사고</div>
                      <table>
                        <tr>
                          <th v-for="header in headers.header06" :key="header">{{ header }}</th>
                        </tr>
                        <tr v-for="content in dataList.data6" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td class="edit2 pa-0">
                            <v-text-field 
                              :maxlength="4" 
                              oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                              v-model="content.VALUE01"
                              :readonly="isReadOnly"
                            />
                          </td>
                          <td class="edit pa-0">
                            <v-text-field 
                              :maxlength="4" 
                              oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                              v-model="content.VALUE02"
                              :readonly="isReadOnly"
                            />
                          </td>
                        </tr>
                      </table>
                    </v-sheet>
                    <v-sheet width="30%" class="pa-2">
                      <div class="title">안전교육</div>
                      <table>
                        <tr>
                          <th v-for="header in headers.header07" :key="header">{{ header }}</th>
                        </tr>
                        <tr v-for="content in dataList.data7" :key="content">
                          <td>{{ content.POINT_NM }}</td>
                          <td :class="[String(content.VALUE01).includes('-') ? 'edit2 pa-0' : 'edit3 pa-0' ]">
                            <v-text-field 
                              :maxlength="4" 
                              oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                              v-model="content.VALUE01"
                              :readonly="isReadOnly"
                            />
                          </td>
                        </tr>
                      </table>
                    </v-sheet>
                  </v-sheet>

                  <v-sheet  class="d-flex" height="auto">
                    <v-sheet width="35%" class="pa-2">
                      <div class="flex-column">
                        <v-sheet>
                          <div class="title">위험성평가</div>
                          <table>
                            <tr>
                              <th v-for="header in headers.header08" :key="header">{{ header }}</th>
                            </tr>
                            <tr v-for="content in dataList.data8" :key="content">
                              <td>{{ content.POINT_NM }}</td>
                              <td :class="[String(content.VALUE01).includes('-') ? 'edit2 pa-0' : 'edit3 pa-0' ]" >
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.VALUE01"
                                  :readonly="isReadOnly"
                                />
                              </td>
                            </tr>
                          </table>
                        </v-sheet>
                        <v-sheet class="mt-4">
                          <div class="title">현장 위험성평가</div>
                          <table>
                            <tr>
                              <th v-for="header in headers.header09" :key="header">{{ header }}</th>
                            </tr>
                            <tr v-for="content in dataList.data9" :key="content">
                              <td>{{ content.POINT_NM }}</td>
                              <td class="edit2 pa-0">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.VALUE01"
                                  :readonly="isReadOnly"
                                />
                              </td>
                            </tr>
                          </table>
                        </v-sheet>
                      </div>
                    </v-sheet>
                    <v-sheet width="40%" class="pa-2">
                      <div class="flex-column">
                        <v-sheet>
                          <div class="title">안전점검/개입</div>
                          <table>
                            <tr>
                              <th v-for="header in headers.header10" :key="header">{{ header }}</th>
                            </tr>
                            <tr v-for="(content, index) in dataList.data10" :key="content">
                              <td v-if="index < 3" class="d-flex justify-center">
                                <div>
                                  <span>
                                    {{ content.POINT_NM }} 
                                  </span>
                                </div>
                                <v-tooltip v-model="SAFFD0020_SHOW1" location="top" v-if="index === 0">
                                  <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props" class="ml-2 cursor-pointer" color="#3ba1f4">
                                      mdi-help-circle
                                    </v-icon>
                                  </template>
                                  <div class="d-flex align-center tooltip_div">
                                    <div>
                                      <span>산출식</span>
                                      <span class="pl-4">=</span>
                                    </div>
                                    <div class="flex-column pl-4">
                                      <div>전일 평균 등록 건수</div>
                                      <v-divider class="border-opacity-100"/>
                                      <div>부서 인원수 X ( <span class="text-blue">{{content.VALUE01}}</span> / 100 )</div>
                                    </div>
                                    <div>
                                      <span class="pl-4">X</span>
                                      <span class="pl-4">5</span>
                                    </div>
                                  </div>
                                </v-tooltip>
                                <v-tooltip v-model="SAFFD0020_SHOW2" location="top" v-if="index === 1">
                                  <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props" class="ml-2 cursor-pointer" color="#3ba1f4" >
                                      mdi-help-circle
                                    </v-icon>
                                  </template>
                                  <div class="d-flex align-center tooltip_div">
                                    <div>
                                      <span>산출식</span>
                                      <span class="pl-4">=</span>
                                    </div>
                                    <div class="flex-column pl-4">
                                      <div>3일 평균 등록 건수</div>
                                      <v-divider class="border-opacity-100"/>
                                      <div>부서 인원수 X ( <span class="text-blue">{{content.VALUE01}}</span> / 100 )</div>
                                    </div>
                                    <div>
                                      <span class="pl-4">X</span>
                                      <span class="pl-4">5</span>
                                    </div>
                                  </div>
                                </v-tooltip>
                              </td>
                              <td v-if="index < 3">{{ content.DESCR }}</td>
                              <td class="edit pa-0" v-if="index < 3">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.VALUE01"
                                  :readonly="isReadOnly"
                                />
                              </td>
                            </tr> 
                          </table>
                        </v-sheet>
                        <v-sheet v-if="dataList.data11.length < 1">
                          <table>
                            <tr>
                              <th v-for="header in headers.header11" :key="header">{{ header }}</th>
                            </tr>
                            <tr v-for="(content, index) in dataList.data10" :key="content" v-show="index === 3">
                              <td v-if="index === 3">{{ content.POINT_NM }}</td>
                              <td v-if="index === 3">{{ content.DESCR }}</td>
                              <td class="edit pa-0" v-if="index === 3">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.VALUE01"
                                  :readonly="isReadOnly"
                                />
                              </td>
                              <td class="edit pa-0" v-if="index === 3">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.VALUE02"
                                  :readonly="isReadOnly"
                                />
                              </td>
                            </tr>
                          </table>
                        </v-sheet>
                        <v-sheet>
                          <table>
                            <tr>
                              <th v-for="header in headers.header12" :key="header">{{ header }} </th>
                            </tr>
                            <tr v-for="(content, index) in dataList.data10" :key="content" v-show="dataList.data11.length > 0 ? index > 2 : index > 3">
                              <td v-if="dataList.data11.length > 0 ? index > 2 : index > 3">{{ content.POINT_NM }}</td>
                              <td :class="[String(content.VALUE01).includes('-') ? 'edit2 pa-0' : 'edit3 pa-0' ]" v-if="dataList.data11.length > 0 ? index > 2 : index > 3">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.VALUE01"
                                  :readonly="isReadOnly"
                                />
                              </td>
                            </tr>
                          </table>
                        </v-sheet>
                        <v-sheet class="mt-4" v-if="dataList.data11.length > 0">
                          <div class="title">고위험점검(3중)</div>
                          <table>
                            <tr>
                              <th v-for="header in headers.header13" :key="header">{{ header }}</th>
                            </tr>
                            <tr v-for="content in dataList.data11" :key="content">
                              <td>{{ content.POINT_NM }}</td>
                              <td class="edit3 pa-0">
                                <v-text-field 
                                  :maxlength="4" 
                                  oninput="javascript: this.value = this.value.replace(/[^0-9+\-\.]/g, '' )" 
                                  v-model="content.VALUE01"
                                  :readonly="isReadOnly"
                                />
                              </td>
                            </tr>
                          </table>
                        </v-sheet>
                      </div>
                    </v-sheet>
                  </v-sheet>

                </div>
              </v-card>
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
.title {
  text-align: center;
  padding: 6px;
  margin: 0 2px 0px 2px;
  font-weight: bold;
  font-size: 12pt;
  border: 1px solid #ccc;
}
th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

td {
  padding: 6px;
  border: 1px solid #ccc;
  text-align: center;
}
.table_area{
  overflow-y: auto;
  max-height: calc(100vh - 290px);
} 
.edit{
  background-color: #eff8fd;
}
::v-deep(.edit > .v-input > .v-input__control > .v-field > .v-field__field){
  height: 30px;
  background-color: #eff8fd;
  font-weight: bold;
}
::v-deep(.edit > .v-input > .v-input__control > .v-field > .v-field__field>.v-field__input){
  text-align: end;
}

::v-deep(.edit2 > .v-input > .v-input__control > .v-field > .v-field__field){
  height: 30px;
  background-color: #eff8fd;
  color: red;
  font-weight: bold;
}
::v-deep(.edit2 > .v-input > .v-input__control > .v-field > .v-field__field>.v-field__input){
  text-align: end;
}

::v-deep(.edit3 > .v-input > .v-input__control > .v-field > .v-field__field){
  height: 30px;
  background-color: #eff8fd;
  color: blue;
  font-weight: bold;
}
::v-deep(.edit3 > .v-input > .v-input__control > .v-field > .v-field__field>.v-field__input){
  text-align: end;
}

::v-deep(.v-field__input){
  padding: 0 10px 6px 10px;
}
.tooltip_div {
  background-color: white;
  color: black;
  margin: -3px -7px;
  padding: 8px;
  font-size: 12pt;
  font-weight: bold;
  // border: 1px solid black;
  text-align: center;
}
</style>
