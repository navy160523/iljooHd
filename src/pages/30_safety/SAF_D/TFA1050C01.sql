-- xx10.tfa1050c01 definition

-- Drop table

-- DROP TABLE xx10.tfa1050c01;

CREATE TABLE xx10.tfa1050c01 (

	cmpny_div varchar(10) NOT NULL,

	jstop_no varchar(12) NOT NULL,

	jstop_time varchar(12) NULL,

	bsns_cd varchar(20) NULL,

	dept_cd varchar(20) NULL,

	asgn_cd varchar(20) NULL,

	chg_emp_no varchar(20) NULL,

	chg_emp_nm varchar(20) NULL,

	jstop_div varchar(20) NULL,

	jstop_desc varchar(500) NULL,

	job_lplc varchar(10) NULL,

	job_mplc varchar(10) NULL,

	job_splc varchar(10) NULL,

	ship_no varchar(10) NULL,

	worker_cnt numeric(5) NULL,

	restart_time varchar(12) NULL,

	restart_div varchar(5) NULL,

	restart_desc varchar(500) NULL,

	jstop_emp_no varchar(20) NULL,

	insert_user_id varchar(20) NULL,

	insert_date timestamp NULL,

	update_user_id varchar(20) NULL,

	update_date timestamp NULL,

	jstop_asgn_cd varchar(20) NULL,

	job_plc_desc varchar(200) NULL,

	file_id varchar(100) NULL,

	vreg_no varchar(20) NULL,

	jstop_dept_cd varchar(20) NULL,

	company varchar(10) NOT NULL,

	sago_div_l varchar(1) DEFAULT 'n'::character varying NULL,

	sago_div_m varchar(1) DEFAULT 'n'::character varying NULL,

	sago_div_s varchar(1) DEFAULT 'n'::character varying NULL,

	file_id2 varchar(100) NULL,

	img_id varchar(100) NULL,

	img_id2 varchar(100) NULL,

	jstop_bsns_cd varchar(20) NULL,

	CONSTRAINT pk_tfa1050c01 PRIMARY KEY (cmpny_div, jstop_no, company)

);

CREATE INDEX idx_tfa1050c01_01 ON xx10.tfa1050c01 USING btree (company, bsns_cd, dept_cd);

CREATE INDEX idx_tfa1050c01_02 ON xx10.tfa1050c01 USING btree (cmpny_div, bsns_cd, dept_cd, asgn_cd);
