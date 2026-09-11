-- xx10.tfa1010c01 definition

-- Drop table

-- DROP TABLE xx10.tfa1010c01;

CREATE TABLE xx10.tfa1010c01 (

	cmpny_div varchar(10) NOT NULL,

	vio_no varchar(12) NOT NULL,

	vio_time varchar(12) NULL,

	bsns_cd varchar(20) NULL,

	dept_cd varchar(100) NULL,

	asgn_cd varchar(100) NULL,

	vio_emp_no varchar(20) NULL,

	violator varchar(20) NULL,

	io_div varchar(1) NULL,

	vio_gdiv varchar(3) NULL,

	vio_mdiv varchar(3) NULL,

	vio_desc varchar(500) NULL,

	vio_lplc varchar(10) NULL,

	vio_mplc varchar(10) NULL,

	vio_splc varchar(10) NULL,

	vio_plc_desc varchar(200) NULL,

	dansok_asgn_cd varchar(20) NULL,

	dansok_emp_no varchar(20) NULL,

	insert_user_id varchar(20) NULL,

	insert_date timestamp NULL,

	update_user_id varchar(20) NULL,

	update_date timestamp NULL,

	file_id1 varchar(100) NULL,

	file_id2 varchar(100) NULL,

	vreg_no varchar(36) NULL,

	sign_id varchar(36) NULL,

	status varchar(2) NULL,

	app_emp_no varchar(20) NULL,

	dansok_dept_cd varchar(20) NULL,

	vend_cd varchar(20) NULL,

	vend_name varchar(200) NULL,

	ship_no varchar(30) NULL,

	company varchar(10) NOT NULL,

	sago_div_l varchar(1) NULL,

	sago_div_m varchar(1) NULL,

	sago_div_s varchar(1) NULL,

	check_target_obj1 varchar(1) NULL,

	check_target_obj2 varchar(1) NULL,

	check_target_obj3 varchar(3) NULL,

	img_id1 varchar(100) NULL,

	act_bsns_cd varchar(20) NULL,

	actor varchar(20) NULL,

	act_emp_no varchar(20) NULL,

	act_dept_cd varchar(20) NULL,

	act_phone varchar(20) NULL,

	act_rslt varchar(500) NULL,

	act_div varchar(20) NULL,

	img_id2 varchar(100) NULL,

	app_same varchar(1) NULL,

	app_asgn_cd varchar(20) NULL,

	app_dept varchar(20) NULL,

	vehicle_type varchar(1) NULL,

	vehicle_car_no varchar(10) NULL,

	vehicle_reg_no varchar(20) NULL,

	vehicle_speed int4 NULL,

	act_date timestamp NULL,

	CONSTRAINT pk_tfa1010c01 PRIMARY KEY (cmpny_div, vio_no, company)

);

CREATE INDEX tfa1010c01_index01 ON xx10.tfa1010c01 USING btree (vio_time);

CREATE INDEX tfa1010c01_index02 ON xx10.tfa1010c01 USING btree (status);

CREATE INDEX tfa1010c01_index03 ON xx10.tfa1010c01 USING btree (cmpny_div, company, vio_emp_no);

CREATE INDEX tfa1010c01_index04 ON xx10.tfa1010c01 USING btree (cmpny_div, vio_emp_no, vio_gdiv, vio_time);

CREATE INDEX tfa1010c01_index05 ON xx10.tfa1010c01 USING btree (company, bsns_cd, dept_cd, asgn_cd);

CREATE INDEX tfa1010c01_index06 ON xx10.tfa1010c01 USING btree (company, bsns_cd, dept_cd);

CREATE INDEX tfa1010c01_index07 ON xx10.tfa1010c01 USING btree (cmpny_div, insert_date);

CREATE INDEX tfa1010c01_test_idx ON xx10.tfa1010c01 USING btree (((COALESCE(TRIM(BOTH FROM vio_emp_no), '-null-'::text) || (violator)::text)));
