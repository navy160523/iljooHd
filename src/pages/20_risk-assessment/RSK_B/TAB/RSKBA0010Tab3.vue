<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'


defineOptions({
  name: '20_risk_assessment-RSK_B-RSKBA0010Tab3',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const tab = ref('tab1')

let inputParams = {
  COL01: '기능 > 공통/사무실',
  COL02: 'HHIS-CW-C550-142-03',
  COL03: '안전 STEP용 발판, 사다리사용',
  COL04: '03',
  COL05: '2022-06-13 11:38',
  COL06: '2022-06-13 11:38',
  COL07: '대조립1부/책임매니저/홍준표',
  COL08: '2022-06-15',
  COL09: '',
  COL10: '누락사항 개정',
  COL11: '김정근 이사',
  COL12: '작업도구A, 작업도구B',
  COL13: '설비1, 설비2',
  COL14: '세슘',
  COL15: '',
  COL16: [
    { no1: '운영위원', no2: '권주현', no3: '책임', no4: 'A349483' },
    { no1: '실행위원(부서추천)', no2: '홍길동', no3: '책임', no4: 'A343422' },
    { no1: '실행위원(조합추천)', no2: '김태호', no3: '사원', no4: 'A392833' },
  ],
  COL17: '현장 안전점검 결과 (어떻게 넣을지는 고민) 사고 즉보, 사고 보고서 및 RCA 결과 (유사 재해만 SORT하여 띄우기) 안전작업요구권 (해당 부서에서 반기 동안 발행되었던 정보) 부서의 사고 재해 현황 조회할 수 있도록(모든 부서 포함)',
}

//그리드 속성셋팅(tab1-Main)
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['COL01'],
  fields : [ 
    { fieldName: 'COL01', dataType: 'text', header: { text:'개정번호' } },
    { fieldName: 'COL02', dataType: 'text', header: { text:'재/개정일자' } },
    { fieldName: 'COL03', dataType: 'text', header: { text:'결재일자' } },
    { fieldName: 'COL04', dataType: 'text', header: { text:'재/개정사유' } },
    { fieldName: 'COL05', dataType: 'text', header: { text:'작성자' } },
  ],
  columns: [],
})

// 그리드 세팅
grdMainProps.columns = grdMainProps.fields

const data1 = [
  { COL01: 'R03', COL02: '2022-06-15 11:38', COL03: '누락사항 개정', COL04: '대조립1부/채임매니저', COL05: '홍준표' },
  { COL01: 'R02', COL02: '2022-06-11 13:00', COL03: '누락사항 개정', COL04: '대조립1부/채임매니저', COL05: '홍준표' },
  { COL01: 'R01', COL02: '2022-06-02 09:00', COL03: '최초 개정', COL04: '대조립1부/채임매니저', COL05: '홍준표' },
]

// 그리드 데이터 바인딩
onMounted(() => {
  grdMain.value.getDataProvider().setRows(data1)
})
</script>

<template>
  <div>
    <VContainer class="pt-0">
      <VRow class="mb-2">
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnRevision', 'btnDelete', 'btnPrint']"
          />
        </VCol>
      </VRow>
      <VCard
        style="background-color: #FAFAFA;"
      >
        <VTabs
          v-model="tab"
        >
          <VTab value="tab1">표준서 정보</VTab>
          <VTab value="tab1">세부내용</VTab>
          <VTab value="tab1">상세리포트</VTab>
        </VTabs>

        <v-card-text>
          <v-window v-model="tab">
            <v-window-item value="tab1">
              <VRow>
                <VCol cols="7">
                  <VRow class="mr-3">
                    <VCol>
                      <IMenuTitle
                        ref="menuTitle"
                        title="작업표준서 기본정보"
                        :button-list="['btnCopy', 'btnMail']"
                      />
                    </VCol>
                  </VRow>
                  <VRow class="mt-4">
                    <!-- 구분 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('구분')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField 
                            v-model="inputParams.COL01"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                    <!-- 표준번호 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('표준번호')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField 
                            v-model="inputParams.COL02"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                    <!-- 표준서명 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('표준서명')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField 
                            v-model="inputParams.COL03"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 개정차수 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('개정차수')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField
                            v-model="inputParams.COL04"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                    <!-- 제정일자 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('제정일자')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField
                            v-model="inputParams.COL05"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                    <!-- 개정일자 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('개정일자')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField
                            v-model="inputParams.COL06"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 작성자 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('작성자')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField
                            v-model="inputParams.COL07"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                    <!-- 결재일자 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('결재일자')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField
                            v-model="inputParams.COL08"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                    <!-- 평가유형 -->
                    <VCol cols="12" md="4">
                      <ILabel
                        :label="$t('평가유형')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VAutocomplete
                            v-model="inputParams.COL09" 
                            :items="['정기', '안전사고', '기타']"
                            value="정기"
                          />
                        </template>      
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 재/개정 사유 -->
                    <VCol cols="12" md="12">
                      <ILabel
                        :label="$t('재/개정 사유')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField
                            v-model="inputParams.COL10"
                          />
                        </template>    
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 작업표준 담당자 -->
                    <VCol cols="12" md="12">
                      <ILabel
                        :label="$t('작업표준 담당자')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField
                            v-model="inputParams.COL11"
                          />
                        </template>    
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 작업도구 -->
                    <VCol cols="12" md="12">
                      <ILabel
                        :label="$t('작업도구')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField 
                            v-model="inputParams.COL12"
                          />
                        </template>    
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 장비 및 설비 -->
                    <VCol cols="12" md="12">
                      <ILabel
                        :label="$t('장비 및 설비')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField 
                            v-model="inputParams.COL13"
                          />
                        </template>    
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 사용 화학물질정보 -->
                    <VCol cols="12" md="12">
                      <ILabel
                        :label="$t('사용 화학물질정보')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField
                            v-model="inputParams.COL14"
                          />
                        </template>    
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 직영부서 담당자 -->
                    <VCol cols="12" md="12">
                      <ILabel
                        :label="$t('직영부서 담당자')"
                        label-width="125"
                      >
                        <template #editor="editorProps">
                          <VTextField 
                            v-model="inputParams.COL15"
                          />
                        </template>    
                      </ILabel>
                    </VCol>
                  </VRow>
                  <VRow>
                    <!-- 위험성평가위원회 -->
                    <VCol cols="12" md="11">
                      <ILabel
                        :label="$t('위험성평가위원회')"
                        label-width="130"
                      >
                        <template #editor="editorProps">
                          <VRow>
                            <VCol 
                              v-for="item in inputParams.COL16" 
                              :key="item"
                            >
                              <VCheckbox />
                              {{ item.no1 }} {{ item.no2 }}{{ item.no3 }} ({{ item.no4 }})
                            </VCol>
                          </VRow>
                        </template>    
                      </ILabel>
                    </VCol>
                    <!-- 메일 전송 버튼 -->
                    <VCol cols="12" md="1">
                      <VBtn>
                        <VIcon
                          size="x-large"
                        >
                          mdi-email-fast-outline
                        </VIcon>
                      </VBtn>
                    </VCol>
                  </VRow>
                  <VRow>
                    <VCol cols="12" md="6">
                      <VRow>
                        <VCol class="ma-3">
                          <span>
                            {{ inputParams.COL17 }}
                          </span>
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12" md="6">
                      <VRow>
                        <VCol class="ma-3">
                          <VRow>
                            <VCol>
                              <h5>중요위험현황</h5>
                            </VCol>
                          </VRow>
                          <VRow>
                            <VCol cols="4">
                              <VRow>
                                <h6>15건</h6>
                              </VRow>
                              <VRow>
                                <span>중요위험</span>
                              </VRow>
                            </VCol>
                            <VCol cols="4">
                              <VRow>
                                <h6>20건</h6>
                              </VRow>
                              <VRow>
                                <span>특별감소대책</span>
                              </VRow>
                            </VCol>
                            <VCol cols="4">
                              <VRow>
                                <h6>15%</h6>
                              </VRow>
                              <VRow>
                                <span>개선이행률</span>
                              </VRow>
                            </VCol>
                          </VRow>
                        </VCol>
                      </VRow>
                    </VCol>
                  </VRow>
                </VCol>
                <VCol cols="5">
                  <!-- 메인그리드 -->
                  <VRow no-gutters>
                    <VCol>
                      <IGridTitle :title="$t('작업표준서 개정이력')">
                        <template #editors />
                      </IGridTitle>
                      <RealGrid
                        ref="grdMain"
                        class="mt-2"
                        height="640"
                        :grid-view-option="grdMainProps.gridViewOption"
                        :keys="grdMainProps.keys" 
                        :fields="grdMainProps.fields"
                        :columns="grdMainProps.columns"
                      />
                    </VCol>
                  </VRow>
                </VCol>
              </VRow>
              <!--  -->
            </v-window-item>

            <!-- 세부내용 -->
            <v-window-item value="tab2">
              세부내용
            </v-window-item>
            <!-- 상세리포트 -->
            <v-window-item value="tab3">
              상세리포트
            </v-window-item>
          </v-window>
        </v-card-text>
      </VCard>
    </VContainer>
  </div>
</template>

<style scoped>
h5 {
  text-align: center;
}

div.v-col.ma-3 {
  background-color: white;
  border: 1px solid; 
  border-radius: 6px;
  border-color: #CCCCCC;
  height: 120px;
}

div.v-row.v-row--dense {
  place-content: center;
}

div.form-item > div.v-row.v-row--dense > div.v-col {
  height: 35px;
  background-color: white;
  border: 1px solid;
  border-radius: 6px;
  border-color: #CCCCCC;
  width: 80%;
  font-size: x-small;
  margin: 4px;
  display: flex;
  align-items: center;
}
</style>