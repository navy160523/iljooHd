<!-- SRMDA0010 Safety Open Market 게시판 -->
<!-- 
  화면명 : Safety Open Market 게시판
  화면개요 : Safety Open Market 조회 , 제안하기 및 관리 하는 화면
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { useRouter }    from 'vue-router'
import { commonSearchApi, getCodeList , commonExecuteApi, commonRequest3 } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'

import SRMDA0010_popup01 from '@/pages/40_safety-risk/SRM_D/Popup/SRMDA0010_popup01.vue'

defineOptions({
  name:'40_safety-risk-SRM_D-SRMDA0010Out',
})

const router = useRouter()
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)

const empPopup = ref(null)  
const empPopup2 = ref(null)  
const sRMDA0010_popup01 = ref(null)

const btnList = ref([])
const fileBtnList = ref([])

const codeList = reactive({
  progressList: [         // 진행상태
    {COD: '' , TXT: '전체'},
    {COD: '' , TXT: '과제 작성중'},
    {COD: '' , TXT: '아이디어 공모중'},
    {COD: '' , TXT: '개선 진행중 (공모완료)'},
    {COD: '' , TXT: '개선 완료'},
  ],
  dateGbnList: [
    { COD: 'A', TXT: '시작일자' },
    { COD: 'B', TXT: '마감일자' },
    { COD: 'C', TXT: '등록일자' }
  ]
})

const GBNLIST = reactive([
  {COD: 'A' , TXT: '제목'},
  {COD: 'B' , TXT: '키워드'},
  {COD: 'C' , TXT: '제목+키워드'},
])

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DIFFICULTY: null,
  PROG_PERI_FROM: dayjs().subtract(1,'month').format('YYYY-MM-DD'),
  PROG_PERI_TO: dayjs().format('YYYY-MM-DD'),
  STATUS: '',
  EMP_NO: null,
  EMP_NM: null,
  SOLT_USER_ID: null,
  SOLT_USER_NM: null,
  RISK_NM: null,
  GBN: 'A',
  DATE_GBN: 'C'
})

const dataSet = reactive({
  searchData: [],          // 조회 데이터
  color: ['rgb(0,176,240)','rgb(0,32,96)','rgb(47,85,151)','rgb(0,177,197)'
          , 'rgb(0,176,240)','rgb(0,32,96)','rgb(47,85,151)','rgb(0,177,197)','rgb(0,177,197)'],               // 키워드 색상
  imageURL: [],
})

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){
    search()
  }
}

const search = async () => {
  dataSet.searchData = []
  let param = {}
  for(let i in searchParams){
    if(i === 'PROG_PERI_FROM' || i === 'PROG_PERI_TO'){
      param[i] = searchParams[i] ? dayjs(searchParams[i]).format('YYYYMMDD') : null
    } else {
      param[i] = await searchParams[i]
    }
  }

  commonSearchApi({ queryId : 'SRMDA0010_SEARCH_01', param: param }).then(res => {
    res.ORESULT_CUR.forEach(async (e, idx) => {
      try {
        let keywordList = []
        let likeList = []
        let reword = e.REWARD
        let gradeColor = null
        
        dataSet.searchData.push(e)

        /* ********* 키워드 리스트 ********* */
        if(e.KEYWORD){ 
          keywordList = await e.KEYWORD.split(',')
        }else (
          keywordList = []
        )
        
        /* ********* REWARD ********* */
        if(e.REWARD){
          reword = await reword.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") + ' 원' 
        } else if(!e.REWARD) {
          reword = '0 원'
        }

        /* ********* grade color ********* */
        if(e.GRADE === '약위험'){
          gradeColor = '#43A047'
        }else if(e.GRADE === '중위험'){
          gradeColor = '#FDD835'
        }else if(e.GRADE === '고위험'){
          gradeColor = '#E53935'
        }

        dataSet.searchData[idx].keywordList = keywordList
        dataSet.searchData[idx].reword = reword
        dataSet.searchData[idx].isLike = false
        dataSet.searchData[idx].gradeColor = gradeColor

        /* 곰감 여부 */
        if(dataSet.searchData[idx].PEOPLE){
          likeList = await dataSet.searchData[idx].PEOPLE.split(',')
          if(likeList.includes(userStore.userId)){
            dataSet.searchData[idx].isLike = true
          }
        }

      } catch(err) {
      }

    })
    
    res.ORESULT_CUR.forEach( (e, idx) => {
      let blob = null
      let imageURL = null
      
      /* ********* 썸네일 이미지 있을시 다운로드 및 image url 변경 ********* */
      if(e.THUMBNAIL_FILE_ID){
        commonSearchApi({queryId: "searchFile", param: {CMPNY_DIV: searchParams.CMPNY_DIV, FILE_ID: e.THUMBNAIL_FILE_ID}}).then(res2 => {
          commonDownloadFilesApi(res2.ORESULT_CUR[0]).then(res3 => {

            blob = new Blob([res3])
            imageURL = URL.createObjectURL(blob)
            dataSet.imageURL[idx] = imageURL
          })
        })
      }else if(!e.THUMBNAIL_FILE_ID){
        dataSet.imageURL[idx] = ''
      }
    })

  })
}

const openPopup = gbn => {
  /* ********* 인원 검색 팝업 ********* */
  if(gbn === 'solt'){
    empPopup2.value.openPopup({EMP_NM: searchParams.SOLT_USER_NM})
  } else {
    empPopup.value.openPopup({EMP_NM: searchParams.EMP_NM})
  }
}

/* ********* 인원 선택후 ********* */
const selectedEmp = val => {
  if(val){
    searchParams.EMP_NM = val.EMP_NM
    searchParams.EMP_NO = val.EMP_NO
  }
}

/* ********* 인원 선택후 ********* */
const selectedSolt = val => {
  if(val){
    searchParams.SOLT_USER_NM = val.EMP_NM
    searchParams.SOLT_USER_ID = val.EMP_NO
  }
}

/* *************** 공감 버튼 클릭 *************** */
const btnLike = async (val, idx) => {
  dataSet.searchData[idx].isLike = !val.isLike

  const data = { 
    queryId: "SRMDA0010_SAVE_01", 
    list: [{
      TASK_NO: val.TASK_NO,
      USER_ID: userStore.userId,
    }] 
  }

  const meta = { useProgress: false }

  await commonRequest3("/hse/common/execute", data, meta).then(res => {
    dataSet.searchData[idx].HEART_CNT = res.list[0].OUT_RES_HEART_CNT
  }).catch(err => {
    return Message.err(err) 
  })
}

/* 제안 팝업 오픈 */
const propose = val => {
  let isReadonly = false
  if(val.STATUS === 'D' || val.STATUS === 'E'){
    isReadonly = true
    sRMDA0010_popup01.value.openPopup(val.TASK_NO, isReadonly)
  }else {
    sRMDA0010_popup01.value.openPopup(val.TASK_NO, isReadonly)
  }
}

/* 제안 팝업 닫기 재조회 */
const updated = val => {
  for(let i in searchParams){
    if(i === 'PROG_PERI_FROM'){
      searchParams[i] = dayjs().subtract(1,'month').format('YYYY-MM-DD')
    }else if(i === 'PROG_PERI_TO'){
      searchParams[i] = dayjs().format('YYYY-MM-DD')
    }else if(i === 'DATE_GBN'){
      searchParams[i] = 'C'
    }else if(i === 'GBN'){
      searchParams[i] = 'A'
    }else {
      searchParams[i] = ''
    }
  }

  onButtonsClick({id: 'btnSearch'})
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIJJE09')
  ]).then(res => {
    let list = []

    list = res[0].ORESULT_CUR.filter(item => {
      if(item.COD !== 'A' && item.COD !== 'B'){
        return true
      }
    })

    codeList.progressList = list
    codeList.progressList.unshift({ TXT:'전체', COD: '' })
  })
}

onMounted(() => {
  
  initCodeList()
  onButtonsClick({id: 'btnSearch'})
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0 position-relative">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <div class="d-flex absolute-center align-center">
        <div class="d-flex align-center">
          <v-sheet class="bg-red-darken-1 rounded-circle mx-auto" style="height: 22px; width: 22px;" />
          <div class="ml-3">
            <span class="text-subtitle-1">고위험</span>
          </div>
        </div>
        <div class="ml-5 d-flex align-center">
          <v-sheet class="bg-yellow-darken-1 rounded-circle mx-auto" style="height: 22px; width: 22px;" />
          <div class="ml-3">
            <span class="text-subtitle-1">중위험</span>
          </div>
        </div>
        <div class="ml-5 d-flex align-center">
          <v-sheet class="bg-green-darken-1 rounded-circle mx-auto" style="height: 22px; width: 22px;" />
          <div class="ml-3">
            <span class="text-subtitle-1">약위험</span>
          </div>
        </div>
      </div>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            width="150px"
            :items="codeList.dateGbnList"
            v-model="searchParams.DATE_GBN"
            item-title="TXT"
            item-value="COD"
            class="mr-0"
          />
          <i-input 
            width="200px"
            v-model="searchParams.PROG_PERI_FROM"
            type="date"
            class="mr-0"
          />
          <div class="pa-1 pt-2">
            ~
          </div>
          <i-input
            width="150px"
            v-model="searchParams.PROG_PERI_TO"
            type="date"
          />
          <i-select
            :label="$t('진행상태')"
            labelWidth="50px"
            width="260px"
            :items="codeList.progressList" 
            v-model="searchParams.STATUS"
            item-title="TXT"
            item-value="COD"
          />
          <i-input
            :label="$t('제보자')"
            labelWidth="45px"
            width="200px"
            append-inner-icon="mdi-magnify"
            v-model="searchParams.EMP_NM"
            @click:appendInner="openPopup('emp')"
            @keydown.enter="openPopup('emp')"
            @input="() => {searchParams.EMP_NO = null}"
          />
          <i-input
            :label="$t('제안자')"
            labelWidth="45px"
            width="200px"
            append-inner-icon="mdi-magnify"
            v-model="searchParams.SOLT_USER_NM"
            @click:appendInner="openPopup('solt')"
            @keydown.enter="openPopup('solt')"
            @input="() => {searchParams.SOLT_USER_ID = null}"
          />
          <i-select
              v-model="searchParams.GBN"
              :items="GBNLIST"
              width="150px"
              item-value="COD"
              item-title="TXT"
              class="mr-0"
            />
          <i-input
            width="300px"
            class="ml-0"
            v-model="searchParams.RISK_NM"
            @keydown.enter="onButtonsClick({id: 'btnSearch'})"
          />
        </v-sheet>
        <v-sheet class="h-auto searchArea">
          <v-row>
            <v-col
              v-for="(item , idx) in dataSet.searchData" 
              cols="12"
              lg="3"
              md="4"
              sm="6"
              :key="idx"
              class="pa-2"
            >
              <v-sheet
                class="border pa-2 bg-white cursor-pointer"
                height="460"
                :elevation="24"
                rounded
              >
                <div class="flex-column fill-height">
                  <v-sheet 
                    class="align-center justify-center border" 
                    height="65%" 
                    rounded 
                    @click="propose(item)"
                  >
                    <v-img 
                      :src="dataSet.imageURL[idx]"
                      width="100%"
                    />
                    <div 
                      class="h-full w-full p-absolute"
                    >
                    <v-sheet class="rounded-circle mt-1 ml-1" style="height: 22px; width: 22px;" :color="item.gradeColor"/>
                    </div>
                    <div class="h-full w-full p-absolute d-flex" v-if="(item.STATUS === 'D' || item.STATUS === 'E') ? true : false">
                      <span class="mt-auto bg-red pa-1">공모종료</span>
                    </div>
                  </v-sheet>
                  <v-sheet height="7%">
                    <div class="d-flex justify-space-between overflow-hidden">
                      <v-sheet width="80%">
                        <div class="d-flex">
                          <v-row class="pt-2">
                            <v-col
                              v-for="(keyword, index) in item.keywordList"
                              :key="index"
                              class="ma-1 pa-0"
                              cols="auto"
                            >
                              <span 
                                class="border pa-1 keyword" 
                                :style="'background-color:' + dataSet.color[index]"
                              >
                                {{ keyword.length > 6 ? keyword.slice(0, 6) + '...'  : keyword }}
                              </span>
                            </v-col>
                            <!-- 키워드 ToolTip -->
                            <v-tooltip
                              activator="parent"
                              location="end"
                            > 
                              <v-sheet width="100%">
                                <v-col
                                  v-for="(keyword, index) in item.keywordList"
                                  :key="index"
                                  class="ma-0 pa-1"
                                  cols="auto"
                                >
                                  <span 
                                    class="border pa-1 keyword" 
                                    :style="'background-color:' + dataSet.color[index]"
                                  >
                                    {{ keyword }}
                                  </span>
                                </v-col>
                              </v-sheet>
                            </v-tooltip>
                          </v-row>
                        </div>
                      </v-sheet>
                      <v-sheet width="20%">
                        <div class="d-flex ma-2">
                          제안수 : {{ item.PROP_CNT }}
                        </div>
                      </v-sheet>
                    </div>
                  </v-sheet>
                  <v-sheet class="flex-column ma-1">
                    <div class="title ml-0 mt-1 text-truncate">
                      {{ item.RISK_NM }}
                      <!-- 제목 ToolTip -->
                      <v-tooltip
                        activator="parent"
                        location="bottom"
                      > 
                        {{ item.RISK_NM }}
                      </v-tooltip>
                    </div>
                    <div class="text-subtitle-1 mt-1 ml-0">
                      <p>{{ item.PROG_PERI_TO ? dayjs(item.PROG_PERI_TO).format('YYYY-MM-DD') : '&nbsp;' }}</p>
                    </div>
                    <div class="d-flex justify-space-between mt-1">
                      <div class="d-flex ma-1">
                        <v-icon 
                          icon="mdi-thumb-up" 
                          class="likeIcon"
                          :color="item.isLike ? 'primary' : 'black'"
                          @click="btnLike(item, idx)"
                        />
                        <span class="ml-2">
                          {{ item.HEART_CNT ? item.HEART_CNT : 0 }}
                        </span>
                        <v-icon icon="mdi-eye" class="ml-2" />
                        <span class="ml-2">
                          {{ item.SEARCH_CNT ? item.SEARCH_CNT : 0 }}
                        </span>
                      </div>
                      <div class="mt-1 reword">
                        {{ item.reword }}
                      </div>
                    </div>
                  </v-sheet>
                  <v-sheet>
                    <v-btn 
                      rounded
                      @click="propose(item)"
                      :disabled="(item.STATUS === 'D' || item.STATUS === 'E') ? true : false"
                    >
                      제안 하기
                    </v-btn>
                  </v-sheet>
                </div>
              </v-sheet>
            </v-col>
          </v-row>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <!-- 제보자 검색 -->
  <EmpPopup ref="empPopup" @selected ="selectedEmp" />
  <EmpPopup ref="empPopup2" @selected ="selectedSolt" />
  <!-- 제안하기(팝업) -->
  <SRMDA0010_popup01 ref="sRMDA0010_popup01" @updated="updated" />

</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
.reword {
  color: red;
  font-size: 12pt;
  font-weight: bold;
}
.title {
  font-size: 14pt;
  font-weight: bold;
}
.keyword {
  color: white;
}

.likeIcon {
  transition: transform 0.3s ease;
  cursor: pointer;
}
.likeIcon:hover {
  // font-size: 130%;
  transform: scale(1.2);
}
.grade {
  writing-mode: vertical-lr;
  font-weight: bold;
  font-size: 12pt;
}

.absolute-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

</style>