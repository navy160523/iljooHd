CREATE TABLE xx10.tfa2010c01 (

	cmpny_div varchar(10) NOT NULL,

	mng_no varchar(40) NOT NULL,

	noti_dt varchar(8) NULL,

	bsns_cd varchar(20) NULL,

	rec_dept_cd varchar(20) NULL,

	ref_depts varchar(200) NULL,

	noti_title varchar(100) NULL,

	img_id1 varchar(36) NULL,

	problem_desc varchar(2000) NULL,

	require_desc varchar(2000) NULL,

	noti_lplc varchar(10) NULL,

	noti_mplc varchar(10) NULL,

	noti_splc varchar(10) NULL,

	noti_plc_desc varchar(100) NULL,

	sago_div_m varchar(100) NULL,

	subject_cd varchar(3) NULL,

	target_facility varchar(2) NULL,

	chk_asgn_cd varchar(20) NULL,

	chk_emp_no varchar(20) NULL,

	chk_tel_no varchar(20) NULL,

	req_reply_dt varchar(8) NULL,

	approve_id varchar(40) NULL,

	act_rslt varchar(4000) NULL,

	act_dept_cd varchar(20) NULL,

	act_asgn_cd varchar(20) NULL,

	act_emp_no varchar(20) NULL,

	act_tel_no varchar(20) NULL,

	status varchar(2) NULL,

	close_dt varchar(8) NULL,

	close_asgn_cd varchar(20) NULL,

	close_emp_no varchar(20) NULL,

	insert_user_id varchar(20) NULL,

	insert_date timestamp NULL,

	update_user_id varchar(20) NULL,

	update_date timestamp NULL,

	sago_div_list varchar(100) NULL,

	close_dept_cd varchar(20) NULL,

	chk_dept_cd varchar(20) NULL,

	act_dt varchar(8) NULL,

	mng_no_old varchar(20) NULL,

	ref_asgns varchar(200) NULL,

	rec_asgn_cd varchar(20) NULL,

	ship_no varchar(10) NULL,

	company varchar(10) NOT NULL,

	reject_desc varchar(1000) NULL,

	vend_name varchar(500) NULL,

	app_emp_no varchar(20) NULL,

	rej_desc varchar(1000) NULL,

	sago_div_l_code varchar(1) DEFAULT 'N'::character varying NULL,

	sago_div_m_code varchar(1) DEFAULT 'N'::character varying NULL,

	sago_div_s_code varchar(1) DEFAULT 'N'::character varying NULL,

	file_id1 varchar(100) NULL,

	file_id2 varchar(100) NULL,

	img_id2 varchar(100) NULL,

	app_same varchar(1) NULL,

	act_bsns_cd varchar(20) NULL,

	chk_bsns_cd varchar(20) NULL,

	CONSTRAINT pk_tfa2010c01 PRIMARY KEY (cmpny_div, mng_no, company)

);

CREATE INDEX idx01_tfa2010c01 ON xx10.tfa2010c01 USING btree (cmpny_div, bsns_cd, rec_dept_cd, rec_asgn_cd);

CREATE INDEX idx02_tfa2010c01 ON xx10.tfa2010c01 USING btree (cmpny_div, noti_dt);

CREATE INDEX idx03_tfa2010c01 ON xx10.tfa2010c01 USING btree (company, bsns_cd, rec_dept_cd);

CREATE INDEX idx04_tfa2010c01 ON xx10.tfa2010c01 USING btree (company, bsns_cd, rec_dept_cd, rec_asgn_cd);

CREATE INDEX idx05_tfa2010c01 ON xx10.tfa2010c01 USING btree (company, noti_dt, approve_id, cmpny_div);
