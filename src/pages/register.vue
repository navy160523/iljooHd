<script setup>
import { VForm } from "vuetify/components";
import authV2MaskDark from "@images/pages/auth-v2-mask-dark.png";
import authV2MaskLight from "@images/pages/auth-v2-mask-light.png";
import authV2RegisterIllustrationBorderedDark from "@images/pages/auth-v2-register-illustration-bordered-dark.png";
import authV2RegisterIllustrationBorderedLight from "@images/pages/auth-v2-register-illustration-bordered-light.png";
import authV2RegisterIllustrationDark from "@images/pages/auth-v2-register-illustration-dark.png";
import authV2RegisterIllustrationLight from "@images/pages/auth-v2-register-illustration-light.png";
import tree2 from "@images/pages/tree-2.png";
import { useGenerateImageVariant } from "@core/composable/useGenerateImageVariant";
import { themeConfig } from "@themeConfig";

import notify from "@hiway/utils/notify";
import {
  getPassCertWithPhone,
  certificate2,
  duplicateCheck,
  joinUsers,
} from "@hiway/api/login";
import {
  required,
  passwordValidator,
  confirmedValidator,
  emailValidator,
} from "@hiway/utils/validation";

import { onBeforeUnmount, getCurrentInstance } from "vue";
import { removeToken, setIsBeforeRemoveToken } from "@/@hiway/utils/token";
import { useI18n } from "vue-i18n";

const vm = getCurrentInstance().proxy;

const { t } = useI18n();

// Router
const router = useRouter();

const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
);
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark);

const message = ref(t("xbuilder.view-register.message1"));
const tab = ref(1);

// 약관 동의
const check1 = ref(false);
const check2 = ref(false);

const checkAll = computed({
  get() {
    return check1.value && check2.value;
  },
  set(value) {
    if (value) {
      check1.value = true;
      check2.value = true;
    } else {
      check1.value = false;
      check2.value = false;
    }
  },
});

const nextStep = () => {
  if (!checkAll.value) {
    notify.warn(t("xbuilder.view-register.notify1"));

    return;
  }

  message.value = t("xbuilder.view-register.message2");
  tab.value = 2;
};

// 인증번호 요청
const refRequestCertNumberForm = ref();

const requestCertNumberForm = reactive({
  userName: "",
  sendPhoneNumber: "",
  recipientPhoneNumber: "",
});

const requestCertNumber = () => {
  refRequestCertNumberForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) {
      getPassCertWithPhone(
        requestCertNumberForm.userName,
        requestCertNumberForm.sendPhoneNumber,
        requestCertNumberForm.recipientPhoneNumber
      )
        .then((res) => {
          setIsBeforeRemoveToken(true);
          notify.success(t("xbuilder.view-register.notify2"));
          registerForm.userName = requestCertNumberForm.userName;
          registerForm.phoneNumber = requestCertNumberForm.recipientPhoneNumber;
          message.value = t("xbuilder.view-register.message3");
          tab.value = 3;
        })
        .catch(() => {
          notify.err(t("xbuilder.view-register.notify3"));
        });
    }
  });
};

// 인증번호 전송
const refSendCertNumberForm = ref();
const certNumber = ref("");

const sendCertNumber = () => {
  refSendCertNumberForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) {
      certificate2(certNumber.value)
        .then(() => {
          notify.success = t("xbuilder.view-register.notify4");
          message.value = t("xbuilder.view-register.message4");
          tab.value = 4;
        })
        .catch(() => {
          notify.err(t("xbuilder.view-register.notify5"));
        });
    }
  });
};

// 회원가입
const refRegisterForm = ref();

const isPasswordVisible = ref(false);
const isPasswordConfirmVisible = ref(false);

const registerForm = reactive({
  userId: "",
  password: "",
  passwordConfirm: "",
  userName: "",
  phoneNumber: "",
  email: "",
});

const join = () => {
  refRegisterForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) {
      const params = {
        user_id: registerForm.userId,
        password: registerForm.password,
        passwordConfirm: registerForm.passwordConfirm,
        kor_nm: registerForm.userName,
        hp_tel: registerForm.phoneNumber,
        email: registerForm.email,
      };

      duplicateCheck(params.user_id).then((res) => {
        if (!res.body) {
          notify.err(t("xbuilder.view-register.notify6"));

          return;
        }
        joinUsers(params)
          .then(() => {
            vm.$swal(t("xbuilder.view-register.message5")).then((res) => {
              removeToken();
              router.push("/login");
            });
          })
          .catch((e) => {
            notify.err(t("xbuilder.view-register.notify7"));
          });
      });
    }
  });
};

const cancle = () => {
  checkAll.value = false;
  refRequestCertNumberForm.value.reset();
  refSendCertNumberForm.value.reset();
  refRegisterForm.value.reset();
  message.value = t("xbuilder.view-register.message6");
  removeToken();

  tab.value = 1;
};

onBeforeUnmount(() => {
  removeToken();
});
</script>

<template>
  <div>
    <!-- Title and Logo -->
    <div class="auth-logo d-flex align-start gap-x-3">
      <!-- <VNodeRenderer :nodes="themeConfig.app.logo" /> -->
      <img :src="themeConfig.app.logo" />

      <h1 class="font-weight-medium leading-normal text-2xl">
        {{ themeConfig.app.title }}
      </h1>
    </div>

    <VRow no-gutters class="auth-wrapper">
      <VCol
        lg="8"
        class="d-none d-lg-flex align-center justify-center position-relative"
      >
        <div class="d-flex align-center justify-center w-100 pa-10 pe-0">
          <VImg
            max-width="768px"
            :src="imageVariant"
            class="auth-illustration"
          />
        </div>

        <VImg :width="150" :src="tree2" class="auth-footer-start-tree" />

        <VImg class="auth-footer-mask" :src="authThemeMask" />
      </VCol>

      <VCol
        cols="12"
        lg="4"
        class="auth-card-v2 d-flex align-center justify-center"
      >
        <VCard flat :width="500" class="mt-12 mt-sm-0 pa-4">
          <VCardText>
            <h5 class="text-h5 mb-1">
              {{ $t("xbuilder.login.createAccount") }} 🚀
            </h5>
            <p class="mb-0">
              {{ message }}
            </p>
          </VCardText>

          <VWindow v-model="tab" disabled>
            <!-- 약관동의 -->
            <VWindowItem :value="1" eager>
              <VCardText>
                <VRow>
                  <!-- id -->
                  <VCol cols="12">
                    <VCheckbox
                      v-model="checkAll"
                      label="전체약관에 동의합니다."
                    />
                  </VCol>
                  <VCol cols="12" class="mB-5">
                    <VCheckbox
                      class="mB-1"
                      v-model="check1"
                      label="회원약관에 동의합니다."
                    />
                    <VTextarea readonly value="동의하십니까?" />
                  </VCol>
                  <VCol cols="12" class="mB-5">
                    <VCheckbox
                      class="mB-1"
                      v-model="check2"
                      label="회원약관에 동의합니다."
                    />
                    <VTextarea readonly value="동의하십니까?" />
                  </VCol>
                  <VCol cols="12" />

                  <!-- Reset link -->
                  <VCol cols="6">
                    <VBtn
                      block
                      variant="outlined"
                      @click="$router.push('/login')"
                      rounded="0"
                      height="45"
                      class="ma-0"
                    >
                      {{ $t("xbuilder.Cancel") }}
                    </VBtn>
                  </VCol>
                  <VCol cols="6">
                    <VBtn block rounded="0" @click="nextStep" height="45">
                      {{ $t("xbuilder.Ok") }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VCardText>
            </VWindowItem>
            <!-- 인증번호 요청 -->
            <VWindowItem :value="2" eager>
              <VCardText>
                <VForm
                  ref="refRequestCertNumberForm"
                  @submit.prevent="requestCertNumber"
                >
                  <VRow>
                    <!-- 이름 -->
                    <VCol cols="12">
                      <VTextField
                        v-model="requestCertNumberForm.userName"
                        :placeholder="$t('xbuilder.Name')"
                        :rules="[required($t('xbuilder.msg.required-name'))]"
                        class="mB-11"
                      />
                    </VCol>
                    <!-- 송신자 휴대폰 번호 -->
                    <!--
                      <VCol cols="12">                      
                      <VTextField
                      v-model="requestCertNumberForm.sendPhoneNumber"
                      :label="$t('Sender phone number')"
                      :rules="[required('송신자 휴대폰 번호를 입력하세요.')]"
                      />
                      </VCol> 
                    -->
                    <!-- 수신자 휴대폰 번호 -->
                    <VCol cols="12" class="mb-4">
                      <VTextField
                        v-model="requestCertNumberForm.recipientPhoneNumber"
                        :placeholder="$t('xbuilder.Phone number')"
                        :rules="[required($t('xbuilder.msg.required-phone'))]"
                        class="mB-11"
                      />
                    </VCol>
                    <!-- Reset link -->
                    <VCol cols="6">
                      <VBtn
                        block
                        variant="outlined"
                        rounded="0"
                        class="ma-0"
                        @click="cancle"
                        height="45"
                      >
                        {{ $t("xbuilder.Cancel") }}
                      </VBtn>
                    </VCol>
                    <VCol cols="6">
                      <VBtn block height="45" type="submit" rounded="0">
                        {{ $t("xbuilder.Send authentication number") }}
                      </VBtn>
                    </VCol>
                  </VRow>
                </VForm>
              </VCardText>
            </VWindowItem>
            <!-- 인증번호 발송 -->
            <v-window-item :value="3" eager>
              <VCardText>
                <VForm
                  ref="refSendCertNumberForm"
                  @submit.prevent="sendCertNumber"
                >
                  <VRow>
                    <!-- 인증버호 -->
                    <VCol cols="12" class="mb-5">
                      <VTextField
                        v-model="certNumber"
                        :placeholder="$t('xbuilder.authentication number')"
                        :rules="[
                          required($t('xbuilder.msg.required-authentication')),
                        ]"
                        type="text"
                        class="mB-11"
                      />
                    </VCol>

                    <!-- Reset link -->
                    <VCol cols="6">
                      <VBtn
                        block
                        variant="outlined"
                        rounded="0"
                        class="ma-0"
                        @click="cancle"
                        height="45"
                      >
                        {{ $t("xbuilder.Cancel") }}
                      </VBtn>
                    </VCol>
                    <VCol cols="6">
                      <VBtn block type="submit" height="45" rounded="0">
                        {{ $t("xbuilder.Ok") }}
                      </VBtn>
                    </VCol>
                  </VRow>
                </VForm>
              </VCardText>
            </v-window-item>
            <!-- 회원 가입 -->
            <v-window-item :value="4" eager>
              <VCardText>
                <VForm ref="refRegisterForm" @submit.prevent="join">
                  <VRow>
                    <!-- 아이디 -->
                    <VCol cols="12">
                      <VTextField
                        v-model="registerForm.userId"
                        :placeholder="$t('id')"
                        :rules="[required($t('xbuilder.msg.required-id'))]"
                        type="text"
                        class="mB-11"
                      />
                    </VCol>
                    <!-- 비밀번호 -->
                    <VCol cols="12">
                      <VTextField
                        v-model="registerForm.password"
                        :placeholder="$t('xbuilder.password')"
                        :rules="[passwordValidator]"
                        :type="isPasswordVisible ? 'text' : 'password'"
                        :append-inner-icon="
                          isPasswordVisible
                            ? 'mdi-eye-off-outline'
                            : 'mdi-eye-outline'
                        "
                        class="mB-11"
                        @click:append-inner="
                          isPasswordVisible = !isPasswordVisible
                        "
                      />
                    </VCol>
                    <!-- 비밀번호 확인 -->
                    <VCol cols="12">
                      <VTextField
                        v-model="registerForm.passwordConfirm"
                        :placeholder="$t('xbuilder.Confirm password')"
                        :rules="[
                          confirmedValidator(
                            registerForm.password,
                            registerForm.passwordConfirm
                          ),
                        ]"
                        :type="isPasswordConfirmVisible ? 'text' : 'password'"
                        :append-inner-icon="
                          isPasswordConfirmVisible
                            ? 'mdi-eye-off-outline'
                            : 'mdi-eye-outline'
                        "
                        class="mB-11"
                        @click:append-inner="
                          isPasswordConfirmVisible = !isPasswordConfirmVisible
                        "
                      />
                    </VCol>
                    <!-- 이름 -->
                    <VCol cols="12">
                      <VTextField
                        v-model="registerForm.userName"
                        :placeholder="$t('xbuilder.Name')"
                        :rules="[required($t('xbuilder.msg.required-name'))]"
                        type="text"
                        class="mB-11"
                        readonly
                      />
                    </VCol>
                    <!-- 휴대폰 번호 -->
                    <VCol cols="12">
                      <VTextField
                        v-model="registerForm.phoneNumber"
                        :placeholder="$t('xbuilder.Phone number')"
                        :rules="[required($t('xbuilder.msg.required-phone'))]"
                        type="text"
                        class="mB-11"
                        readonly
                      />
                    </VCol>
                    <!-- Email -->
                    <VCol cols="12" class="mb-5">
                      <VTextField
                        v-model="registerForm.email"
                        placeholder="Email"
                        :rules="[emailValidator]"
                        type="text"
                        class="mB-11"
                      />
                    </VCol>
                    <!-- Reset link -->
                    <VCol cols="6">
                      <VBtn
                        block
                        @click="cancle"
                        rounded="0"
                        height="45"
                        variant="outlined"
                        class="ma-0"
                      >
                        {{ $t("xbuilder.Cancel") }}
                      </VBtn>
                    </VCol>
                    <VCol cols="6">
                      <VBtn block type="submit" rounded="0" height="45">
                        {{ $t("xbuilder.Ok") }}
                      </VBtn>
                    </VCol>
                  </VRow>
                </VForm>
              </VCardText>
            </v-window-item>
          </VWindow>
          <VCardText class="text-center">
            <!-- back to login -->
            <RouterLink class="text-primary ms-2" :to="{ name: 'login' }">
              <VIcon class="flip-in-rtl" icon="mdi-chevron-left" />
              <span>{{ $t("xbuilder.login.backToLogin") }}</span>
            </RouterLink>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>

<route lang="yaml">
meta:
  layout: blank  
  redirectIfLoggedIn: true
  removeToken: true
</route>
