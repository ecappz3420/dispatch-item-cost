"use client";
import React, { useState, useEffect, useRef } from "react";
import { Form, Input, InputNumber, Select, Button, Modal, Flex } from "antd";
import currencies from "@/utils/currencies";
import { useSearchParams } from "next/navigation";

const currencyOptions = currencies.map((currency) => ({
  label: currency.code,
  value: currency.code,
  key: currency.code,
}));

const App = () => {
  const [form] = Form.useForm();
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [convertedCurrency, setConvertedCurrency] = useState("ZMW");
  const [amount, setAmount] = useState(0);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [currencyModify, setCurrencyModify] = useState(0);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const inputRef = useRef(null);

  const params = useSearchParams();
  const id = params.get("id");

  useEffect(() => {
    if (id) {
      setEditMode(true);
      const fetchRecord = async () => {
        try {
          const queryParams = new URLSearchParams({
            reportName: "All_Dispatch_Item_Costs",
            criteria: `(ID == ${id})`,
          });
          const response = await fetch(`/api/zoho?${queryParams}`, {
            method: "GET",
          });
          const data = await response.json();
          if (data.records.code === 3000) {
            const record = data.records.data[0];
            form.setFieldValue("Item", record.Item);
            setBaseCurrency(record.Base_Currency);
            setConvertedCurrency(record.Converted_Currency);
            setAmount(record.Paying_In?.replace(/[^0-9.]/g, "") || 0);
            setConvertedAmount(record.Cost?.replace(/[^0-9.]/g, "") || 0);
          }
          console.log(data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchRecord();
    }
  }, [id]);

  const fetchExchangeRate = async (base, converted) => {
    try {
      const query = new URLSearchParams({ currency: base });
      const response = await fetch(`/api/currency-exchange?${query}`, {
        method: "GET",
      });
      const data = await response.json();
      return data.data.conversion_rates[converted];
    } catch (error) {
      console.error(error);
      return 0;
    }
  };

  const getExchangeRate = async () => {
    const exchange_rate = await fetchExchangeRate(
      baseCurrency,
      convertedCurrency
    );
    setExchangeRate(exchange_rate);
    setCurrencyModify(exchange_rate);
    const converted_amount = amount * exchange_rate;
    setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
  };
  useEffect(() => {
    if (!editMode) {
      getExchangeRate();
    }
  }, []);
  const handleCurrencyChange = async (currency) => {
    if (baseCurrency === currency) {
      setConvertedCurrency(currency);
    } else {
      setConvertedCurrency(currency);
      const exchange_rate = await fetchExchangeRate(baseCurrency, currency);
      setCurrencyModify(exchange_rate);
      setExchangeRate(exchange_rate);
      const converted_amount = amount * exchange_rate;
      setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
    }
  };
  const handleBaseCurrencyChange = async (currency) => {
    if (currency === convertedCurrency) {
      setBaseCurrency(currency);
    } else {
      setBaseCurrency(currency);
      const exchange_rate = await fetchExchangeRate(
        currency,
        convertedCurrency
      );
      setExchangeRate(exchange_rate);
      setCurrencyModify(exchange_rate);
      const converted_amount = amount * exchange_rate;
      setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
    }
  };
  const handleAmountChange = (value) => {
    setAmount(value);
    const converted_amount = value * exchangeRate;
    setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
  };
  const handleConversionRate = () => {
    setExchangeRate(currencyModify);
    const converted_amount = amount * currencyModify;
    setConvertedAmount(converted_amount.toFixed(2)); // round to 2 decimal places
  };

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current.select(); // Select the text inside the input
      }, 100); // Small delay to ensure modal animation is complete
    }
  }, [open]);

  const payingInCurrenciesSelect = (
    <Form.Item name="Base_Currency" initialValue="USD" noStyle>
      <Select
        showSearch
        options={currencyOptions.map(({ key, ...rest }) => ({
          ...rest,
          key,
        }))}
        onChange={(value) => handleBaseCurrencyChange(value)}
      />
    </Form.Item>
  );

  const costCurrenciesSelect = (
    <Form.Item name="Converted_Currency" initialValue="ZMW" noStyle>
      <Select
        showSearch
        options={currencyOptions.map(({ key, ...rest }) => ({
          ...rest,
          key,
        }))}
        onChange={(value) => handleCurrencyChange(value)}
      />
    </Form.Item>
  );

  const onSubmit = async (data) => {
    const formData = {
      ...data,
      Paying_In: `${
        currencies.find((i) => i.code === baseCurrency).symbol
      } ${amount}`,
      Cost: `${
        currencies.find((i) => i.code === convertedCurrency).symbol
      } ${convertedAmount}`,
      Base_Currency: baseCurrency,
      Converted_Currency: convertedCurrency,
      Approval_Status: "Pending",
    };
    console.log(formData);
    try {
      const response = await fetch("/api/zoho", {
        method: editMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: editMode
          ? JSON.stringify({ formData, id })
          : JSON.stringify({ formName: "Dispatch_Item_Cost", formData }),
      });
      const result = await response.json();
      console.log(result);
      form.resetFields();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="p-2 bg-[#FAFBFE] ">
        <h4 className="font-medium">Dispatch Item Cost</h4>
      </div>
      <div className="px-2 pb-2">
        <Form
          form={form}
          onFinish={onSubmit}
          layout="vertical"
          scrollToFirstError={true}
          initialValues={{ Paying_In: 0, Cost: 0 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 py-2 gap-4 justify-items-start">
            <Form.Item
              label="Item"
              name="Item"
              rules={[{ required: true, message: "Item is required" }]}
              className="w-[300px]"
            >
              <Input />
            </Form.Item>
            <Flex vertical>
              <Form.Item
                label="Paying In"
                name="Paying_In"
                className="w-[300px] mb-1"
              >
                <InputNumber
                  step={0.01}
                  addonBefore={payingInCurrenciesSelect}
                  className="w-[300px]"
                  onChange={(value) => handleAmountChange(value)}
                />
              </Form.Item>
              {baseCurrency !== convertedCurrency && (
                <div className="p-1 text-xs flex items-center text-blue-500 justify-start gap-[10px]">
                  <div>{`1 ${baseCurrency} = ${exchangeRate} ${convertedCurrency}`}</div>
                  <small
                    className="cursor-pointer"
                    onClick={() => setOpen(true)}
                  >
                    Edit
                  </small>
                  <Modal
                    title="Modify Currency"
                    open={open}
                    onClose={() => setOpen((curr) => !curr)}
                    onCancel={() => setOpen((curr) => !curr)}
                    footer={
                      <Button
                        type="submit"
                        onClick={() => {
                          handleConversionRate();
                          setOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    }
                  >
                    <Input
                      autoFocus
                      ref={inputRef}
                      className="mt-2"
                      defaultValue={currencyModify}
                      onChange={(e) => setCurrencyModify(e.target.value)}
                    />
                  </Modal>
                </div>
              )}
            </Flex>
            <Form.Item label="Cost" name="Cost" className="w-[300px]">
              <InputNumber
                step={0.01}
                addonBefore={costCurrenciesSelect}
                className="w-[300px]"
                readOnly
              />
            </Form.Item>
          </div>
          <Flex justify="center" gap="large">
            <Form.Item label={null}>
              <Button className="w-28" htmlType="reset">
                Reset
              </Button>
            </Form.Item>
            <Form.Item label={null}>
              <Button type="primary" htmlType="submit" className="w-28">
                Submit
              </Button>
            </Form.Item>
          </Flex>
        </Form>
      </div>
    </>
  );
};

export default App;
